import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class UserDataService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private get uid() {
    return this.auth.currentUser?.uid;
  }

  private getDocRef(path: string) {
    return doc(this.firestore, `users/${this.uid}/${path}`);
  }

  async getData(path: string) {
    const ref = this.getDocRef(path);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  }

  async saveData(path: string, data: any) {
    const ref = this.getDocRef(path);
    return setDoc(ref, data, { merge: true });
  }

  async updateData(path: string, data: any) {
    const ref = this.getDocRef(path);
    return updateDoc(ref, data);
  }

 async createData(path: string, data: any) {
  if (!this.uid) throw new Error('User not logged in');
  const docRef = doc(this.firestore, `users/${this.uid}/${path}`);
  const snap = await getDoc(docRef);
  if (snap.exists()) throw new Error('Document already exists');
  return setDoc(docRef, data);
}


}
