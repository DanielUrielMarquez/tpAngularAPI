import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap, catchError, finalize } from 'rxjs/operators';
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

  // Control de carga
  cargando = false;
  offset = 0;
  limit = 200;
  totalPokemons = 1300;

  constructor(private pokemonService: PokemonService) {}

  ngOnInit(): void {
    this.cargarTipos();
    this.cargarMasPokemons();
  }

  /** Cargar lista de tipos */
  cargarTipos() {
    this.pokemonService.getTypes().subscribe((res: any) => {
      this.tipos = res.results;
    });
  }

  /** Cargar más Pokémon por lotes para evitar sobrecarga */
  cargarMasPokemons() {
  if (this.cargando || this.offset >= this.totalPokemons) return;

  this.cargando = true;
  this.pokemonService.getPokemons(this.offset, this.limit)
    .pipe(
      switchMap((res: any) => {
        if (!res || res.length === 0) return of([]);
        const detalles$: Observable<any>[] = res.map((p: any) =>
          this.pokemonService.getPokemonDetail(p.url).pipe(
            catchError(err => {
              console.error(`Error al obtener detalles de ${p.name}`, err);
              return of(null);
            })
          )
        );
        return forkJoin(detalles$);
      }),
      finalize(() => (this.cargando = false))
    )
    .subscribe((detalles: any[]) => {
      const nuevos = detalles
        .filter(p => p !== null)
        .map(p => ({
          name: p.name,
          types: p.types.map((t: any) => t.type.name),
          imagen:
            p.sprites.front_default ||
            p.sprites.other?.['official-artwork']?.front_default ||
            'assets/no-image.png'
        }));

      this.pokemons.push(...nuevos);
      this.offset += this.limit; // avanzar el offset para la próxima carga
    });
}


  /** Filtro de búsqueda y tipo */
  get pokemonsFiltrados() {
    return this.pokemons.filter(p => {
      const coincideNombre = p.name.toLowerCase().includes(this.filtro.toLowerCase());
      const coincideTipo = !this.tipoSeleccionado || p.types.includes(this.tipoSeleccionado);
      return coincideNombre && coincideTipo;
    });
  }
}
