import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap, catchError, finalize } from 'rxjs/operators';
import { PokemonService } from '../../services/pokemon.service';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './pokemon-list.component.html',
  styleUrls: ['./pokemon-list.component.css']
})

export class PokemonListComponent implements OnInit {
  pokemons: {
  id: number;
  name: string;
  types: string[];
  abilities: string[];
  games: string[];
  imagen: string | null;
  imagenPixel: string;
}[] = [];


  pokemonSeleccionado: any = null;
  mostrarDetalle = false;

  tipos: { name: string }[] = [];
  filtro: string = '';
  tipoSeleccionado: string = '';

  // Control de carga
  cargando = false;
  offset = 0;
  limit = 200;
  totalPokemons = 1300;
p: any;
pokeImg: any;

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
    .subscribe((detalles: any) => {
      const nuevos = detalles
        .filter((p: null) => p !== null)
        .map((p: any) => ({
  id: p.id,
  name: p.name,
  types: p.types.map((t: any) => t.type.name),
  abilities: p.abilities.map((a: any) => a.ability.name),
  games: p.game_indices.map((g: any) => g.version.name),

  // 🎮 SPRITE PIXEL RETRO
  imagenPixel: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`,

  // 🎨 IMAGEN GRANDE (ARTWORK)
  imagen:
    p.sprites.other?.['official-artwork']?.front_default ||
    p.sprites.front_default ||
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
abrirDetalle(pokemon: any, img: HTMLImageElement) {

  if (!img) return;

  const rect = img.getBoundingClientRect();
  const clone = img.cloneNode(true) as HTMLImageElement;

  clone.style.position = 'fixed';
  clone.style.top = rect.top + 'px';
  clone.style.left = rect.left + 'px';
  clone.style.width = rect.width + 'px';
  clone.style.height = rect.height + 'px';
  clone.style.transition = 'all 0.45s ease';
  clone.style.zIndex = '9999';
  clone.style.pointerEvents = 'none';

  document.body.appendChild(clone);
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    clone.style.top = '50%';
    clone.style.left = '50%';
    clone.style.transform = 'translate(-50%, -50%) scale(1.4)';
  });

  setTimeout(() => {
    this.pokemonSeleccionado = pokemon;
    this.mostrarDetalle = true;
    document.body.style.overflow = '';
    clone.remove();
  }, 450);
}

  cerrarDetalle() {
    this.mostrarDetalle = false;
    this.pokemonSeleccionado = null;
  }
}
