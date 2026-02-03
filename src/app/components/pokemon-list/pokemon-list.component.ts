import { Component, OnInit } from '@angular/core';
import { LoginComponent } from '../../auth/login/login.component';
import { RegistroComponent } from '../../auth/registro/registro.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap, catchError, finalize } from 'rxjs/operators';
import { PokemonService } from '../../services/pokemon.service';
import { FavoritesService } from '../../services/favorites.service';
import { Auth, authState, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, LoginComponent, RegistroComponent],
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

  evoluciones: {
    id: number;
    name: string;
    imagenPixel: string;
  }[] = [];

  pokemonSeleccionado: any = null;
  mostrarDetalle = false;

  tipos: { name: string }[] = [];
  filtro: string = '';
  tipoSeleccionado: string = '';

  cargando = false;
  offset = 0;
  limit = 200;
  totalPokemons = 1300;

  showLogin = false;
  showRegister = false;

  userUid: string | null = null;
  currentUserName = '';
  favoritos = new Set<number>();
  soloFavoritos = false;

  constructor(
    private pokemonService: PokemonService,
    private favoritesService: FavoritesService,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarTipos();
    this.cargarMasPokemons();

    authState(this.auth).subscribe(async user => {
      this.resetListado();
      this.pokemonService.resetLoadedPokemons();

      if (!user) {
        this.userUid = null;
        this.currentUserName = '';
        this.favoritos.clear();
        this.soloFavoritos = false;
        this.router.navigate(['/login']);
        return;
      }

      this.userUid = user.uid;
      this.currentUserName = user.displayName || (user.email ? user.email.split('@')[0] : '');
      this.favoritos.clear();
      this.soloFavoritos = false;

      const favs = await this.favoritesService.getFavorites(this.userUid);
      this.favoritos = new Set<number>(favs);

      this.cargarMasPokemons();
    });
  }

  get isLoggedIn(): boolean {
    return !!this.userUid;
  }

  private resetListado() {
    this.pokemons = [];
    this.offset = 0;
    this.cargando = false;
    this.pokemonSeleccionado = null;
    this.mostrarDetalle = false;
  }

  cargarTipos() {
    this.pokemonService.getTypes().subscribe((res: any) => {
      this.tipos = res.results;
    });
  }

  get tieneEvoluciones(): boolean {
    return this.evoluciones.length > 1;
  }

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
            imagenPixel: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`,
            imagen:
              p.sprites.other?.['official-artwork']?.front_default ||
              p.sprites.front_default ||
              'assets/no-image.png'
          }));

        this.pokemons.push(...nuevos);
        this.offset += this.limit;
      });
  }

  cargarEvoluciones(pokemonId: number) {
    this.evoluciones = [];

    this.pokemonService.getPokemonSpecies(pokemonId).subscribe((species: any) => {
      this.pokemonService.getEvolutionChain(species.evolution_chain.url)
        .subscribe((chainData: any) => {

          const recorrer = (chain: any) => {
            const name = chain.species.name;
            const id = Number(chain.species.url.split('/').slice(-2, -1)[0]);

            this.evoluciones.push({
              id,
              name,
              imagenPixel: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
            });

            if (chain.evolves_to.length > 0) {
              chain.evolves_to.forEach((evo: any) => recorrer(evo));
            }
          };

          recorrer(chainData.chain);
        });
    });
  }

  get pokemonsFiltrados() {
    return this.pokemons.filter(p => {
      const coincideNombre = p.name.toLowerCase().includes(this.filtro.toLowerCase());
      const coincideTipo = !this.tipoSeleccionado || p.types.includes(this.tipoSeleccionado);
      const coincideFavorito = !this.soloFavoritos || this.favoritos.has(p.id);
      return coincideNombre && coincideTipo && coincideFavorito;
    });
  }

  async toggleFavorito(id: number) {
    if (!this.userUid) {
      this.openLogin();
      return;
    }

    if (this.favoritos.has(id)) {
      this.favoritos.delete(id);
      await this.favoritesService.removeFavorite(this.userUid, id);
    } else {
      this.favoritos.add(id);
      await this.favoritesService.addFavorite(this.userUid, id);
    }
  }

  esFavorito(id: number): boolean {
    return this.favoritos.has(id);
  }

  toggleSoloFavoritos() {
    this.soloFavoritos = !this.soloFavoritos;
  }

  async logout() {
    await signOut(this.auth);
    this.userUid = null;
    this.currentUserName = '';
    this.favoritos.clear();
    this.soloFavoritos = false;
    this.router.navigate(['/login']);
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
      this.cargarEvoluciones(pokemon.id);
      document.body.style.overflow = '';
      clone.remove();
    }, 450);
  }

  cerrarDetalle() {
    this.mostrarDetalle = false;
    this.pokemonSeleccionado = null;
    this.evoluciones = [];
  }

  openLogin() {
    this.showRegister = false;
    this.showLogin = true;
  }

  closeLogin() {
    this.showLogin = false;
  }

  openRegister() {
    this.showLogin = false;
    this.showRegister = true;
  }

  closeRegister() {
    this.showRegister = false;
  }
}
