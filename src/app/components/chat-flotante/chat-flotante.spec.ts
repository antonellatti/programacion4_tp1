import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatFlotante } from './chat-flotante';

describe('ChatFlotante', () => {
  let component: ChatFlotante;
  let fixture: ComponentFixture<ChatFlotante>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatFlotante],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatFlotante);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
