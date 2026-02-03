import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  constructor(private firestore: Firestore) {}

  private userDoc(uid: string) {
    return doc(this.firestore, `users/${uid}`);
  }

  async getFavorites(uid: string): Promise<number[]> {
    const snap = await getDoc(this.userDoc(uid));
    if (!snap.exists()) return [];
    const data = snap.data() as { favorites?: number[] };
    return data.favorites || [];
  }

  async addFavorite(uid: string, pokemonId: number): Promise<void> {
    const ref = this.userDoc(uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, { favorites: [pokemonId] });
      return;
    }

    await updateDoc(ref, {
      favorites: arrayUnion(pokemonId)
    });
  }

  async removeFavorite(uid: string, pokemonId: number): Promise<void> {
    const ref = this.userDoc(uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, { favorites: [] });
      return;
    }

    await updateDoc(ref, {
      favorites: arrayRemove(pokemonId)
    });
  }
}
