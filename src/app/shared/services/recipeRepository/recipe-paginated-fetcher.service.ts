import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/compat/firestore';
import {Observable} from 'rxjs';
import 'rxjs/add/operator/scan';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';


@Injectable()
export class RecipePaginatedFetcherService {
  // Observable data
  data: Observable<any>;
  private _done = new BehaviorSubject(false);
  done: Observable<boolean> = this._done.asObservable();
  private _loading = new BehaviorSubject(false);
  loading: Observable<boolean> = this._loading.asObservable();
  private _data = new BehaviorSubject([]);
  private query: QueryConfig;

  constructor(private afs: AngularFirestore) {
  }

  init() {
    console.log('init() exec');
    if (this._data.getValue().length > 0) {
      return;
    }

    console.log('fetching in init');

    this.query = {
      path: 'recipes',
      field: 'created',
      limit: 2,
      reverse: false,
      prepend: false,
    };

    const first = this.afs.collection(this.query.path, ref => {
      return ref
        .orderBy(this.query.field, this.query.reverse ? 'desc' : 'asc')
        .limit(this.query.limit);
    });

    this.mapAndUpdate(first);

    // Create the observable array for consumption in components
    this.data = this._data.asObservable()
      .scan((acc, val) => {
        return this.query.prepend ? val.concat(acc) : acc.concat(val);
      });

    return this.data;
  }

  more() {
    const cursor = this.getCursor();

    if (!cursor) {
      return;
    }

    const more = this.afs.collection(this.query.path, ref => {
      return ref
        .orderBy(this.query.field, this.query.reverse ? 'desc' : 'asc')
        .limit(this.query.limit)
        .startAfter(cursor.created);
    });
    this.mapAndUpdate(more);
    return this.data;
  }

  private getCursor() {
    const current = this._data.value;
    if (current.length) {
      return this.query.prepend ? current[0] : current[current.length - 1];
    }
    console.log('cursor is null');
    return null;
  }


  // Maps the snapshot to usable format the updates source
  private mapAndUpdate(col: AngularFirestoreCollection<any>) {

    if (this._done.value || this._loading.value) {
      console.log('not updating anymore');
      console.log('this._loading.value=' + this._loading.value);
      console.log('this._done.value=' + this._done.value);
      return;
    }

    // loading
    this._loading.next(true);

    // Map snapshot with doc ref (needed for cursor)
    return col.snapshotChanges()
      .do(arr => {
        let values = arr.map(snap => {
          const data = snap.payload.doc.data();
          const id = snap.payload.doc.id;
          return {id, ...data};
        });

        // If prepending, reverse the batch order
        values = this.query.prepend ? values.reverse() : values;

        // update source with new values, done loading
        this._data.next(values);
        this._loading.next(false);

        // no more values, mark done
        if (!values.length) {
          this._done.next(true);
          console.log('done -> true');
        }
      })
      .take(1)
      .subscribe();
  }
}

interface QueryConfig {
  path: string; //  path to collection
  field: string; // field to orderBy
  limit: number; // limit per query
  reverse: boolean; // reverse order?
  prepend: boolean; // prepend to source?
}
