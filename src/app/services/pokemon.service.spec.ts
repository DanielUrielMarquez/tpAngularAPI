import { TestBed } from '@angular/core/testing';

import { PokemonService } from './pokemon.service';
// Test para el servicio PokemonService
describe('PokemonService', () => {
  let service: PokemonService;
// Configuración del TestBed para el servicio
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PokemonService);
  });
// Test para verificar que el servicio se crea correctamente
  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
