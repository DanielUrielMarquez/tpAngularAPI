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
// Evoluciones del Pokémon seleccionado
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
// Inyección de servicios y router
  constructor(
    private pokemonService: PokemonService,
    private favoritesService: FavoritesService,
    private auth: Auth,
    private router: Router
  ) {}
// Suscripción al estado de autenticación y carga inicial de datos
  ngOnInit(): void {
    this.cargarTipos();
    this.cargarMasPokemons();
// Se suscribe a los cambios en el estado de autenticación para actualizar la UI y cargar los favoritos
    authState(this.auth).subscribe(async user => {
      this.resetListado();
      this.pokemonService.resetLoadedPokemons();
// Si no hay usuario, se limpia la información y se redirige al login
      if (!user) {
        this.userUid = null;
        this.currentUserName = '';
        this.favoritos.clear();
        this.soloFavoritos = false;
        this.router.navigate(['/login']);
        return;
      }
// Si hay usuario, se carga su información y favoritos, y se muestra la lista de Pokémon
      this.userUid = user.uid;
      this.currentUserName = user.displayName || (user.email ? user.email.split('@')[0] : '');
      this.favoritos.clear();
      this.soloFavoritos = false;

      const favs = await this.favoritesService.getFavorites(this.userUid);
      this.favoritos = new Set<number>(favs);

      this.cargarMasPokemons();
    });
  }
// Getter para verificar si el usuario está logueado
  get isLoggedIn(): boolean {
    return !!this.userUid;
  }
// Método para reiniciar el listado de Pokémon y limpiar la información relacionada
  private resetListado() {
    this.pokemons = [];
    this.offset = 0;
    this.cargando = false;
    this.pokemonSeleccionado = null;
    this.mostrarDetalle = false;
  }
// Método para cargar los tipos de Pokémon disponibles
  cargarTipos() {
    this.pokemonService.getTypes().subscribe((res: any) => {
      this.tipos = res.results;
    });
  }
// Getter para verificar si el Pokémon seleccionado tiene evoluciones
  get tieneEvoluciones(): boolean {
    return this.evoluciones.length > 1;
  }
// Método para cargar más Pokémon desde la API, evitando duplicados y manejando errores
  cargarMasPokemons() {
    if (this.cargando || this.offset >= this.totalPokemons) return;
// Se establece el estado de carga y se realiza la petición para obtener los Pokémon
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
      ) // Se procesan los detalles obtenidos y se actualiza la lista de Pokémon
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
// Se agregan los nuevos Pokémon a la lista y se actualiza el offset para la próxima carga
        this.pokemons.push(...nuevos);
        this.offset += this.limit;
      });
  }
// Método para cargar las evoluciones de un Pokémon seleccionado, recorriendo la cadena evolutiva
  cargarEvoluciones(pokemonId: number) {
    this.evoluciones = [];

    this.pokemonService.getPokemonSpecies(pokemonId).subscribe((species: any) => {
      this.pokemonService.getEvolutionChain(species.evolution_chain.url)
        .subscribe((chainData: any) => {
// Función recursiva para recorrer la cadena evolutiva y extraer la información de cada evolución
          const recorrer = (chain: any) => {
            const name = chain.species.name;
            const id = Number(chain.species.url.split('/').slice(-2, -1)[0]);
// Se agrega la evolución actual al listado de evoluciones
            this.evoluciones.push({
              id,
              name,
              imagenPixel: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
            });
// Si la evolución actual tiene evoluciones siguientes, se recorre cada una de ellas
            if (chain.evolves_to.length > 0) {
              chain.evolves_to.forEach((evo: any) => recorrer(evo));
            }
          };
// Se inicia el recorrido de la cadena evolutiva desde el nodo raíz
          recorrer(chainData.chain);
        });
    });
  }
// Getter para obtener la lista de Pokémon filtrados según el nombre, tipo y favoritos
  get pokemonsFiltrados() {
    return this.pokemons.filter(p => {
      const coincideNombre = p.name.toLowerCase().includes(this.filtro.toLowerCase());
      const coincideTipo = !this.tipoSeleccionado || p.types.includes(this.tipoSeleccionado);
      const coincideFavorito = !this.soloFavoritos || this.favoritos.has(p.id);
      return coincideNombre && coincideTipo && coincideFavorito;
    });
  }
// Método para alternar el estado de favorito de un Pokémon, agregándolo o quitándolo de la lista de favoritos del usuario
  async toggleFavorito(id: number) {
    if (!this.userUid) {
      this.openLogin();
      return;
    }
// Si el Pokémon ya es favorito, se quita de la lista y se actualiza el servicio; si no, se agrega a la lista y se actualiza el servicio
    if (this.favoritos.has(id)) {
      this.favoritos.delete(id);
      await this.favoritesService.removeFavorite(this.userUid, id);
    } else {
      this.favoritos.add(id);
      await this.favoritesService.addFavorite(this.userUid, id);
    }
  }
// Método para verificar si un Pokémon es favorito, utilizado para mostrar el estado en la UI
  esFavorito(id: number): boolean {
    return this.favoritos.has(id);
  }
// Método para alternar la visualización de solo los Pokémon favoritos
  toggleSoloFavoritos() {
    this.soloFavoritos = !this.soloFavoritos;
  }
// Método para cerrar sesión, limpiando la información del usuario y redirigiendo al login
  async logout() {
    await signOut(this.auth);
    this.userUid = null;
    this.currentUserName = '';
    this.favoritos.clear();
    this.soloFavoritos = false;
    this.router.navigate(['/login']);
  }
// Método para abrir el detalle de un Pokémon con una animación de zoom desde la imagen del Pokémon
  abrirDetalle(pokemon: any, img: HTMLImageElement) {
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const clone = img.cloneNode(true) as HTMLImageElement;
// Se posiciona el clon exactamente sobre la imagen original para crear el efecto de zoom
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
// Después de la animación, se muestra el detalle del Pokémon seleccionado y se carga su información evolutiva
    setTimeout(() => {
      this.pokemonSeleccionado = pokemon;
      this.mostrarDetalle = true;
      this.cargarEvoluciones(pokemon.id);
      document.body.style.overflow = '';
      clone.remove();
    }, 450);
  }
// Método para cerrar el detalle del Pokémon, ocultando la información y limpiando las evoluciones
  cerrarDetalle() {
    this.mostrarDetalle = false;
    this.pokemonSeleccionado = null;
    this.evoluciones = [];
  }
// Métodos para abrir y cerrar los modales de login y registro, asegurando que solo uno esté abierto a la vez
  openLogin() {
    this.showRegister = false;
    this.showLogin = true;
  }
// Método para cerrar el modal de login
  closeLogin() {
    this.showLogin = false;
  }
// Método para abrir el modal de registro, cerrando el de login si está abierto
  openRegister() {
    this.showLogin = false;
    this.showRegister = true;
  }
// Método para cerrar el modal de registro
  closeRegister() {
    this.showRegister = false;
  }
}
