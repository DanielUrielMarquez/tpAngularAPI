import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

interface PokemonListResponse {
  results: { name: string; url: string }[];
  next: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private baseUrl = 'https://pokeapi.co/api/v2';
  private loadedPokemonNames = new Set<string>();

  constructor(private http: HttpClient) {}

  // Traer pokemons sin repetir
  getPokemons(offset: number = 0, limit: number = 100): Observable<{ name: string; url: string }[]> {
    return this.http.get<PokemonListResponse>(`${this.baseUrl}/pokemon?offset=${offset}&limit=${limit}`)
      .pipe(
        map(response => {
          // Filtrar los que ya fueron cargados
          const newPokemons = response.results.filter(p => !this.loadedPokemonNames.has(p.name));
          // Guardar los nuevos en el set para no repetir
          newPokemons.forEach(p => this.loadedPokemonNames.add(p.name));
          return newPokemons;
        })
      );
  }

  // Traer tipos
getTypes(): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/type/`);
}

  // Traer detalles de un Pokémon
getPokemonDetail(url: string): Observable<any> {
  return this.http.get<any>(url);
}

  // Traer detalles de una especie de Pokémon
getPokemonSpecies(id: number): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/pokemon-species/${id}`);
}

  // Traer cadena evolutiva
getEvolutionChain(url: string): Observable<any> {
  return this.http.get<any>(url);
}

  // Reiniciar el registro de pokemons cargados
resetLoadedPokemons() {
  this.loadedPokemonNames.clear();
}
}
