import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';
import { WorkoutService, Workout, Exercise, ExerciseSet } from '../services/workout.service';

@Component({
  selector: 'app-exercise-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exercise-page.component.html',
  styleUrls: ['./exercise-page.component.css']
})
export class ExerciseComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private auth = inject(Auth);
  private workoutService = inject(WorkoutService);

  userName = signal('Loading...');
  workouts = signal<Workout[]>([]);
  activeWorkoutIndex = signal(0);
  newExerciseName = signal('');
  
  // Success message for logging
  logSuccessMessage = signal('');

  private saveTimeout: any = null;

  activeWorkout = computed(() => 
    this.workouts()[this.activeWorkoutIndex()] ?? { 
      id: 'default', 
      name: 'Default Workout', 
      date: new Date().toISOString().split('T')[0], 
      exercises: [] 
    } as Workout
  );

  ngOnInit() {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.userName.set(user.displayName || user.email || 'User');
        this.loadWorkouts();
      } else {
        console.log('No user logged in');
        this.router.navigate(['/auth']);
      }
    });
  }

  ngOnDestroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }

  async loadWorkouts() {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        console.warn('User not authenticated, redirecting to login');
        this.router.navigate(['/auth']);
        return;
      }

      console.log('Loading workouts for user:', user.uid);
      const workouts = await this.workoutService.loadWorkouts();
      
      console.log('Workouts loaded:', workouts.length, 'workout(s)');
      this.workouts.set(workouts);
    } catch (err: any) {
      console.error('Failed to load workouts:', err);
      console.error('Error code:', err?.code);
      console.error('Error message:', err?.message);
      
      if (err?.code === 'permission-denied') {
        console.warn('Permission denied - redirecting to login');
        this.router.navigate(['/auth']);
      }
      
      this.workouts.set([]);
    }
  }

  private async saveWorkouts() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(async () => {
      try {
        await this.workoutService.saveWorkouts(this.workouts());
      } catch (error) {
        console.error('Error saving workouts:', error);
      }
    }, 500);
  }

  // Log the current workout to history
  async logCurrentWorkout() {
    try {
      const workout = this.activeWorkout();
      if (!workout || workout.exercises.length === 0) {
        alert('No exercises to log!');
        return;
      }

      await this.workoutService.logWorkoutSession(workout);
      
      this.logSuccessMessage.set('✅ Workout logged successfully!');
      setTimeout(() => this.logSuccessMessage.set(''), 3000);
      
      console.log('Workout logged to history!');
    } catch (error) {
      console.error('Error logging workout:', error);
      alert('Failed to log workout. Please try again.');
    }
  }

  switchWorkout(index: number) {
    this.activeWorkoutIndex.set(index);
  }

  async addWorkoutData() {
    try {
      const workouts = await this.workoutService.createInitialWorkouts();
      console.log('Initial workouts created successfully!');
      this.workouts.set(workouts);
    } catch (error) {
      console.error('Error creating initial workouts:', error);
    }
  }

  addExercise() {
    const name = this.newExerciseName().trim();
    if (!name) return;

    const workouts = [...this.workouts()];
    const activeWorkout = workouts[this.activeWorkoutIndex()];
    
    if (!activeWorkout) {
      console.error('No active workout');
      return;
    }

    activeWorkout.exercises.push({
      id: Date.now().toString(),
      name,
      sets: [{ reps: 10, weight: 0 }],
      unit: 'kg'
    });

    this.workouts.set(workouts);
    this.newExerciseName.set('');
    this.saveWorkouts();
  }

  deleteExercise(exerciseId: string) {
    const workouts = [...this.workouts()];
    const activeWorkout = workouts[this.activeWorkoutIndex()];
    
    if (!activeWorkout) return;

    activeWorkout.exercises = activeWorkout.exercises.filter(e => e.id !== exerciseId);

    this.workouts.set(workouts);
    this.saveWorkouts();
  }

  addSet(exerciseId: string) {
    const workouts = [...this.workouts()];
    const exercise = workouts[this.activeWorkoutIndex()]?.exercises.find(e => e.id === exerciseId);
    
    if (exercise) {
      const lastSet = exercise.sets[exercise.sets.length - 1];
      exercise.sets.push({ ...lastSet });
      this.workouts.set(workouts);
      this.saveWorkouts();
    }
  }

  removeSet(exerciseId: string, setIndex: number) {
    const workouts = [...this.workouts()];
    const exercise = workouts[this.activeWorkoutIndex()]?.exercises.find(e => e.id === exerciseId);
    
    if (exercise && exercise.sets.length > 1) {
      exercise.sets.splice(setIndex, 1);
      this.workouts.set(workouts);
      this.saveWorkouts();
    }
  }

  adjustReps(exerciseId: string, setIndex: number, delta: number) {
    const workouts = [...this.workouts()];
    const exercise = workouts[this.activeWorkoutIndex()]?.exercises.find(e => e.id === exerciseId);
    
    if (exercise && exercise.sets[setIndex]) {
      exercise.sets[setIndex].reps = Math.max(0, exercise.sets[setIndex].reps + delta);
      this.workouts.set(workouts);
      this.saveWorkouts();
    }
  }

  adjustWeight(exerciseId: string, setIndex: number, delta: number) {
    const workouts = [...this.workouts()];
    const exercise = workouts[this.activeWorkoutIndex()]?.exercises.find(e => e.id === exerciseId);
    
    if (exercise && exercise.sets[setIndex]) {
      exercise.sets[setIndex].weight = Math.max(0, exercise.sets[setIndex].weight + delta);
      this.workouts.set(workouts);
      this.saveWorkouts();
    }
  }

  updateReps(exerciseId: string, setIndex: number, value: string) {
    const workouts = [...this.workouts()];
    const exercise = workouts[this.activeWorkoutIndex()]?.exercises.find(e => e.id === exerciseId);
    
    if (exercise && exercise.sets[setIndex]) {
      exercise.sets[setIndex].reps = Math.max(0, parseInt(value) || 0);
      this.workouts.set(workouts);
      this.saveWorkouts();
    }
  }

  updateWeight(exerciseId: string, setIndex: number, value: string) {
    const workouts = [...this.workouts()];
    const exercise = workouts[this.activeWorkoutIndex()]?.exercises.find(e => e.id === exerciseId);
    
    if (exercise && exercise.sets[setIndex]) {
      exercise.sets[setIndex].weight = Math.max(0, parseFloat(value) || 0);
      this.workouts.set(workouts);
      this.saveWorkouts();
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
      this.router.navigate(['/auth']);
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}