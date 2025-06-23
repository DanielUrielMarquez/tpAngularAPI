import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { PokemonService } from '../../services/pokemon.service';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pokemon-list.component.html',
  styleUrls: ['./pokemon-list.component.css']
})
export class PokemonListComponent implements OnInit {
  pokemons: { name: string; types: string[]; imagen: string | null }[] = [];
  tipos: { name: string }[] = [];
  filtro: string = '';
  tipoSeleccionado: string = '';

  constructor(private pokemonService: PokemonService) {}

  ngOnInit(): void {
    // Cargar tipos para el filtro
    this.pokemonService.getTypes().subscribe((res: any) => {
      this.tipos = res.results;
    });

    // Cargar pokemons con sus detalles (incluyendo tipos e imagen)
    this.pokemonService.getPokemons()
      .pipe(
        switchMap((res: any): Observable<any[]> => {
          const detalles$: Observable<any>[] = res.results.map((p: any) =>
            this.pokemonService.getPokemonDetail(p.url).pipe(
              catchError(err => {
                console.error(`Error al obtener detalles de ${p.name}`, err);
                return of(null); // No interrumpe forkJoin
              })
            )
          );
          return forkJoin(detalles$);
        })
      )
      .subscribe((detalles: any[]) => {
        this.pokemons = detalles
          .filter(p => p !== null)
          .map(p => ({
            name: p.name,
            types: p.types.map((t: any) => t.type.name),
            imagen: p.sprites.front_default
          }));
      });
  }

  get pokemonsFiltrados() {
    return this.pokemons.filter(p => {
      const coincideNombre = p.name.toLowerCase().includes(this.filtro.toLowerCase());
      const coincideTipo = !this.tipoSeleccionado || p.types.includes(this.tipoSeleccionado);
      return coincideNombre && coincideTipo;
    });
  }
}
