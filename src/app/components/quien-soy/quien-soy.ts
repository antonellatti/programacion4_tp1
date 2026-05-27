import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GithubService } from '../../services/github';

@Component({
  selector: 'app-quien-soy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './quien-soy.html',
  styleUrl: './quien-soy.css'
})
export class QuienSoy implements OnInit {
  githubUser: any = null;
  loading = true;

  private githubUsername = 'antonellatti';

  constructor(
    private githubService: GithubService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.githubService.getUsuario(this.githubUsername).subscribe({
      next: (data) => {
        this.githubUser = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('Error GitHub:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}