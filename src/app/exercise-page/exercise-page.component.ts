// dashboard.component.ts
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { getAuth, signOut } from 'firebase/auth';

interface ExerciseSet {
  reps: number;
  weight: number;
}

interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
  unit: string; // 'kg' or 'lbs'
  notes?: string;
}

interface Workout {
  id: string;
  name: string;
  date: string;
  exercises: Exercise[];
}

@Component({
  selector: 'app-exercise-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exercise-page.component.html',
  styleUrls: ['./exercise-page.component.css']
})
export class ExerciseComponent {
  userName = signal('Alex Johnson');
  
  // Workouts data - hardcoded examples based on your format
  workouts = signal<Workout[]>([
    {
      id: 'lower-1',
      name: 'LOWER BODY',
      date: '2025-12-03',
      exercises: [
        {
          id: 'step-ups',
          name: 'Step ups',
          sets: [
            { reps: 12, weight: 15 },
            { reps: 10, weight: 18 },
            { reps: 8, weight: 20 }
          ],
          unit: 'kg'
        },
        {
          id: 'kickbacks',
          name: 'Kickbacks',
          sets: [
            { reps: 15, weight: 40 },
            { reps: 13, weight: 45 },
            { reps: 11, weight: 50 }
          ],
          unit: 'kg'
        },
        {
          id: 'indreptari',
          name: 'Îndreptări',
          sets: [
            { reps: 12, weight: 5 },
            { reps: 12, weight: 5 },
            { reps: 9, weight: 7.5 }
          ],
          unit: 'kg'
        },
        {
          id: 'aductii',
          name: 'Aducții',
          sets: [
            { reps: 13, weight: 40 },
            { reps: 13, weight: 40 },
            { reps: 13, weight: 40 },
            { reps: 13, weight: 40 }
          ],
          unit: 'kg'
        },
        {
          id: 'extensii',
          name: 'Extensii quads',
          sets: [
            { reps: 12, weight: 0 },
            { reps: 12, weight: 0 },
            { reps: 12, weight: 0 },
            { reps: 12, weight: 0 }
          ],
          unit: 'kg',
          notes: 'bodyweight'
        }
      ]
    },
    {
      id: 'upper-1',
      name: 'UPPER BODY',
      date: '2025-12-04',
      exercises: [
        {
          id: 'ramat',
          name: 'Ramât',
          sets: [
            { reps: 13, weight: 19 },
            { reps: 11, weight: 21 },
            { reps: 11, weight: 21 },
            { reps: 9, weight: 24 }
          ],
          unit: 'kg'
        },
        {
          id: 'tractiuni',
          name: 'Tracțiuni',
          sets: [
            { reps: 13, weight: 24 },
            { reps: 9, weight: 27 },
            { reps: 9, weight: 27 },
            { reps: 7, weight: 29 }
          ],
          unit: 'kg'
        },
        {
          id: 'face-pull',
          name: 'Face pull',
          sets: [
            { reps: 13, weight: 20 },
            { reps: 13, weight: 20 },
            { reps: 9, weight: 25 }
          ],
          unit: 'kg'
        },
        {
          id: 'arnold',
          name: 'Arnold press',
          sets: [
            { reps: 13, weight: 3 },
            { reps: 13, weight: 3 },
            { reps: 9, weight: 5 }
          ],
          unit: 'kg'
        },
        {
          id: 'triceps',
          name: 'Triceps',
          sets: [
            { reps: 13, weight: 10 },
            { reps: 13, weight: 10 },
            { reps: 11, weight: 15 }
          ],
          unit: 'kg'
        },
        {
          id: 'biceps',
          name: 'Biceps',
          sets: [
            { reps: 12, weight: 3 },
            { reps: 12, weight: 3 },
            { reps: 8, weight: 5 }
          ],
          unit: 'kg'
        },
        {
          id: 'ridicari',
          name: 'Ridicări laterale',
          sets: [
            { reps: 13, weight: 3 },
            { reps: 13, weight: 3 },
            { reps: 9, weight: 5 }
          ],
          unit: 'kg'
        },
        {
          id: 'lombar',
          name: 'Lombar',
          sets: [
            { reps: 12, weight: 0 },
            { reps: 12, weight: 0 },
            { reps: 12, weight: 0 }
          ],
          unit: 'kg',
          notes: 'bodyweight'
        }
      ]
    }
  ]);
  
  activeWorkoutIndex = signal(0);
  newExerciseName = signal('');
  
  activeWorkout = computed(() => this.workouts()[this.activeWorkoutIndex()]);
  
  constructor(private router: Router) {}
  
  // Switch between workouts
  switchWorkout(index: number) {
    this.activeWorkoutIndex.set(index);
  }
  
  // Add new exercise
  addExercise() {
    const name = this.newExerciseName().trim();
    if (!name) return;
    
    const workouts = [...this.workouts()];
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: name,
      sets: [{ reps: 10, weight: 0 }],
      unit: 'kg'
    };
    
    workouts[this.activeWorkoutIndex()].exercises.push(newExercise);
    this.workouts.set(workouts);
    this.newExerciseName.set('');
  }
  
  // Delete exercise
  deleteExercise(exerciseId: string) {
    const workouts = [...this.workouts()];
    workouts[this.activeWorkoutIndex()].exercises = 
      workouts[this.activeWorkoutIndex()].exercises.filter(e => e.id !== exerciseId);
    this.workouts.set(workouts);
  }
  
  // Add set to exercise
  addSet(exerciseId: string) {
    const workouts = [...this.workouts()];
    const exercise = workouts[this.activeWorkoutIndex()].exercises.find(e => e.id === exerciseId);
    if (exercise) {
      const lastSet = exercise.sets[exercise.sets.length - 1];
      exercise.sets.push({ ...lastSet });
    }
    this.workouts.set(workouts);
  }
  
  // Remove set from exercise
  removeSet(exerciseId: string, setIndex: number) {
    const workouts = [...this.workouts()];
    const exercise = workouts[this.activeWorkoutIndex()].exercises.find(e => e.id === exerciseId);
    if (exercise && exercise.sets.length > 1) {
      exercise.sets.splice(setIndex, 1);
    }
    this.workouts.set(workouts);
  }
  
  // Increase/decrease reps
  adjustReps(exerciseId: string, setIndex: number, delta: number) {
    const workouts = [...this.workouts()];
    const exercise = workouts[this.activeWorkoutIndex()].exercises.find(e => e.id === exerciseId);
    if (exercise) {
      const newReps = Math.max(0, exercise.sets[setIndex].reps + delta);
      exercise.sets[setIndex].reps = newReps;
    }
    this.workouts.set(workouts);
  }
  
  // Increase/decrease weight
  adjustWeight(exerciseId: string, setIndex: number, delta: number) {
    const workouts = [...this.workouts()];
    const exercise = workouts[this.activeWorkoutIndex()].exercises.find(e => e.id === exerciseId);
    if (exercise) {
      const newWeight = Math.max(0, exercise.sets[setIndex].weight + delta);
      exercise.sets[setIndex].weight = newWeight;
    }
    this.workouts.set(workouts);
  }
  
  // Manual input for reps
  updateReps(exerciseId: string, setIndex: number, value: string) {
    const workouts = [...this.workouts()];
    const exercise = workouts[this.activeWorkoutIndex()].exercises.find(e => e.id === exerciseId);
    if (exercise) {
      const reps = parseInt(value) || 0;
      exercise.sets[setIndex].reps = Math.max(0, reps);
    }
    this.workouts.set(workouts);
  }
  
  // Manual input for weight
  updateWeight(exerciseId: string, setIndex: number, value: string) {
    const workouts = [...this.workouts()];
    const exercise = workouts[this.activeWorkoutIndex()].exercises.find(e => e.id === exerciseId);
    if (exercise) {
      const weight = parseFloat(value) || 0;
      exercise.sets[setIndex].weight = Math.max(0, weight);
    }
    this.workouts.set(workouts);
  }
  
  async logout() {
    const auth = getAuth();
    try {
      await signOut(auth);
      this.router.navigate(['/auth']);
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}


