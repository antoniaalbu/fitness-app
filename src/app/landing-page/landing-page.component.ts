import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  scrollY = 0;
  currentSection = 0;
  sections = ['hero', 'mission', 'features', 'social', 'cta'];

  @HostListener('window:scroll')
  onScroll() {
    this.scrollY = window.scrollY;
  }

  ngOnInit() {
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    // Special observer for the zoom image
    const zoomObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('zoomed');
          }
        });
      },
      { threshold: 0.3 }
    );

    // Observe all animated elements after view init
    setTimeout(() => {
      document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
      document.querySelectorAll('.zoom-on-scroll').forEach((el) => zoomObserver.observe(el));
    }, 100);
  }

  scrollToSection(section: string) {
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
  }
}