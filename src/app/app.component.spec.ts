import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
// Test para el componente AppComponent
describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });
// Test para verificar que el componente se crea correctamente
  it('should create the app', () => {
  const fixture = TestBed.createComponent(AppComponent);
  const app = fixture.componentInstance;
  expect(app).toBeTruthy();
});

// Test para verificar que el título del componente es 'proyecto_2'
  it(`should have the 'proyecto_2' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('proyecto_2');
  });
// Test para verificar que el título se renderiza correctamente en el HTML
  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, proyecto_2');
  });
});
