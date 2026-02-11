import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PokemonListComponent } from './pokemon-list.component';
// Test para el componente PokemonListComponent
describe('PokemonListComponent', () => {
  let component: PokemonListComponent;
  let fixture: ComponentFixture<PokemonListComponent>;
// Configuración del TestBed para el componente
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonListComponent]
    })
    .compileComponents();
// Creación del componente y detección de cambios
    fixture = TestBed.createComponent(PokemonListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
// Test para verificar que el componente se crea correctamente
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
