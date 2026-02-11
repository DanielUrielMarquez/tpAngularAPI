import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  constructor(private firestore: Firestore) {}

  // hace referencia al documento del usuario donde se guardan sus favoritos
  private userDoc(uid: string) {
    return doc(this.firestore, `users/${uid}`);
  }

  // se obtiene la lista de favoritos del usuario (o vacío si no existe)
  async getFavorites(uid: string): Promise<number[]> {
    const snap = await getDoc(this.userDoc(uid));
    if (!snap.exists()) return [];
    const data = snap.data() as { favorites?: number[] };
    return data.favorites || [];
  }

  // se agrega un Pokémon a favoritos (crea el doc si no existe)
  async addFavorite(uid: string, pokemonId: number): Promise<void> {
    const ref = this.userDoc(uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, { favorites: [pokemonId] });
      return;
    }
// Si ya existe, se agrega el nuevo Pokémon al array de favoritos sin duplicados
    await updateDoc(ref, {
      favorites: arrayUnion(pokemonId)
    });
  }

  // quita un Pokémon de favoritos (si no existe el doc, lo crea vacío)
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
