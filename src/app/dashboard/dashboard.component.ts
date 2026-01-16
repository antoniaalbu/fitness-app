import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';
import { ModalComponent } from '../modal/modal.component';
import { DashboardStore } from './dashboard.store';
import { WorkoutService } from '../services/workout.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(Auth);
  private workoutService = inject(WorkoutService);
  
  // Inject the store (provided at root level)
  readonly store = inject(DashboardStore);

  async ngOnInit() {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.store.setUserName(user.displayName || user.email || 'User');
        await this.store.loadAllData();
      } else {
        this.router.navigate(['/auth']);
      }
    });
  }

  // Utility methods
  getGoalProgress(goal: any): number {
    return Math.round((goal.current / goal.target) * 100);
  }

  goToExercises() {
    this.router.navigate(['/exercises']);
  }

  getExerciseCount(workout: any): number {
    return workout.exercises.length;
  }

  getTotalSets(workout: any): number {
    return workout.exercises.reduce((sum: number, exercise: any) => 
      sum + exercise.sets.length, 0
    );
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  getHistorySummary() {
    return this.workoutService.getRecentWorkoutsSummary(
      this.store.workoutHistory(), 
      7
    );
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/auth']);
  }
}