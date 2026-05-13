import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quien-soy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quien-soy.html',
  styleUrls: ['./quien-soy.css']
})
export class QuienSoy implements OnInit {
  githubUser: any = null;
  loading = true;

  private githubUsername = 'antonellatti';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get(`https://api.github.com/users/${this.githubUsername}`)
      .subscribe({
        next: (data) => { this.githubUser = data; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }
}