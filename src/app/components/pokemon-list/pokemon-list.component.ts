import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PokemonService } from '../../services/pokemon.service';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,   // ¡Esto es OBLIGATORIO!
  imports: [CommonModule, FormsModule],
  templateUrl: './pokemon-list.component.html',
  styleUrls: ['./pokemon-list.component.css']
})

export class PokemonListComponent implements OnInit {
  pokemons: any[] = [];
  filtro: string = '';

  constructor(private pokemonService: PokemonService) {}

  ngOnInit(): void {
    this.pokemonService.getPokemons().subscribe((response: any) => {
      this.pokemons = response.results;
    });
  }

  get pokemonsFiltrados() {
    return this.pokemons.filter(p =>
      p.name.toLowerCase().includes(this.filtro.toLowerCase())
    );
  }
}
