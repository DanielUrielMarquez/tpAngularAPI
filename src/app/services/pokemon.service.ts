import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  baseUrl = 'https://pokeapi.co/api/v2';

  constructor(private http: HttpClient) {}

  getPokemons() {
    return this.http.get(`${this.baseUrl}/pokemon?limit=152`);
  }

  getTypes() {
    return this.http.get(`${this.baseUrl}/type/`);
  }

  getPokemonDetail(url: string) {
    return this.http.get(url);
  }
}
