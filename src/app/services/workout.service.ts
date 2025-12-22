import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

export interface ExerciseSet {
  reps: number;
  weight: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
  unit: string;
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  exercises: Exercise[];
}

export interface WorkoutHistoryEntry {
  id: string;
  workoutName: string;
  exerciseName: string;
  date: string;
  timestamp: number;
  sets: ExerciseSet[];
  unit: string;
  totalVolume: number; // total weight × reps
  maxWeight: number;
  totalReps: number;
}

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private get uid() {
    return this.auth.currentUser?.uid;
  }

  private getWorkoutsDocRef() {
    if (!this.uid) {
      throw new Error('User not authenticated');
    }
    return doc(this.firestore, `users/${this.uid}/workouts/list`);
  }

  private getHistoryDocRef() {
    if (!this.uid) {
      throw new Error('User not authenticated');
    }
    return doc(this.firestore, `users/${this.uid}/workouts/history`);
  }

  async loadWorkouts(): Promise<Workout[]> {
    try {
      const docRef = this.getWorkoutsDocRef();
      const snapshot = await getDoc(docRef);
      
      if (snapshot.exists()) {
        const data = snapshot.data();
        return data?.['data'] || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error loading workouts:', error);
      throw error;
    }
  }

  async saveWorkouts(workouts: Workout[]): Promise<void> {
    try {
      const docRef = this.getWorkoutsDocRef();
      await setDoc(docRef, { data: workouts }, { merge: true });
      console.log('💾 Workouts saved to Firestore');
    } catch (error) {
      console.error('Error saving workouts:', error);
      throw error;
    }
  }

  // Load workout history
  async loadHistory(): Promise<WorkoutHistoryEntry[]> {
    try {
      const docRef = this.getHistoryDocRef();
      const snapshot = await getDoc(docRef);
      
      if (snapshot.exists()) {
        const data = snapshot.data();
        return (data?.['entries'] || []).sort((a: WorkoutHistoryEntry, b: WorkoutHistoryEntry) => 
          b.timestamp - a.timestamp
        );
      }
      
      return [];
    } catch (error) {
      console.error('Error loading history:', error);
      throw error;
    }
  }

  // Log a workout session to history
  async logWorkoutSession(workout: Workout): Promise<void> {
    try {
      const timestamp = Date.now();
      const historyEntries: WorkoutHistoryEntry[] = [];

      // Create history entry for each exercise
      for (const exercise of workout.exercises) {
        if (exercise.sets.length === 0) continue;

        const totalVolume = exercise.sets.reduce((sum, set) => 
          sum + (set.weight * set.reps), 0
        );
        const maxWeight = Math.max(...exercise.sets.map(s => s.weight));
        const totalReps = exercise.sets.reduce((sum, set) => sum + set.reps, 0);

        historyEntries.push({
          id: `${timestamp}-${exercise.id}`,
          workoutName: workout.name,
          exerciseName: exercise.name,
          date: workout.date,
          timestamp,
          sets: [...exercise.sets],
          unit: exercise.unit,
          totalVolume,
          maxWeight,
          totalReps
        });
      }

      if (historyEntries.length === 0) return;

      // Load existing history and append new entries
      const existingHistory = await this.loadHistory();
      const updatedHistory = [...existingHistory, ...historyEntries];

      // Keep only last 100 entries to avoid bloat
      const trimmedHistory = updatedHistory.slice(0, 100);

      const docRef = this.getHistoryDocRef();
      await setDoc(docRef, { entries: trimmedHistory });
      
      console.log(`📝 Logged ${historyEntries.length} exercises to history`);
    } catch (error) {
      console.error('Error logging workout session:', error);
      throw error;
    }
  }

  // Get progress data for a specific exercise
  getExerciseProgress(history: WorkoutHistoryEntry[], exerciseName: string): WorkoutHistoryEntry[] {
    return history
      .filter(entry => entry.exerciseName.toLowerCase() === exerciseName.toLowerCase())
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  // Get recent workouts summary
  getRecentWorkoutsSummary(history: WorkoutHistoryEntry[], days: number = 7): {
    totalSessions: number;
    totalVolume: number;
    totalExercises: number;
    avgVolumePerSession: number;
  } {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentEntries = history.filter(entry => entry.timestamp >= cutoff);

    const sessions = new Set(recentEntries.map(e => e.timestamp)).size;
    const totalVolume = recentEntries.reduce((sum, e) => sum + e.totalVolume, 0);

    return {
      totalSessions: sessions,
      totalVolume: Math.round(totalVolume),
      totalExercises: recentEntries.length,
      avgVolumePerSession: sessions > 0 ? Math.round(totalVolume / sessions) : 0
    };
  }

  async createInitialWorkouts(): Promise<Workout[]> {
    const timestamp = Date.now();
    const workouts: Workout[] = [
      {
        id: `lower-${timestamp}`,
        name: 'Lower Body',
        date: new Date().toISOString().split('T')[0],
        exercises: [
          {
            id: `${timestamp}-1`,
            name: 'Step ups',
            sets: [
              { reps: 12, weight: 15 },
              { reps: 10, weight: 18 },
              { reps: 8, weight: 20 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-2`,
            name: 'Kickbacks',
            sets: [
              { reps: 15, weight: 40 },
              { reps: 13, weight: 45 },
              { reps: 11, weight: 50 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-3`,
            name: 'Indreptari',
            sets: [
              { reps: 12, weight: 5 },
              { reps: 12, weight: 5 },
              { reps: 9, weight: 7.5 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-4`,
            name: 'Aductii',
            sets: [
              { reps: 13, weight: 40 },
              { reps: 13, weight: 40 },
              { reps: 13, weight: 40 },
              { reps: 13, weight: 40 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-5`,
            name: 'Extensii quads',
            sets: [
              { reps: 12, weight: 0 },
              { reps: 12, weight: 0 },
              { reps: 12, weight: 0 },
              { reps: 12, weight: 0 }
            ],
            unit: 'kg',
            notes: 'Weight not specified'
          }
        ]
      },
      {
        id: `upper-${timestamp}`,
        name: 'Upper Body',
        date: new Date().toISOString().split('T')[0],
        exercises: [
          {
            id: `${timestamp}-6`,
            name: 'Ramat',
            sets: [
              { reps: 13, weight: 19 },
              { reps: 11, weight: 21 },
              { reps: 11, weight: 21 },
              { reps: 9, weight: 24 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-7`,
            name: 'Tractiuni',
            sets: [
              { reps: 13, weight: 24 },
              { reps: 9, weight: 27 },
              { reps: 9, weight: 27 },
              { reps: 7, weight: 29 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-8`,
            name: 'Face pull',
            sets: [
              { reps: 13, weight: 20 },
              { reps: 13, weight: 20 },
              { reps: 9, weight: 25 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-9`,
            name: 'Arnold press',
            sets: [
              { reps: 13, weight: 3 },
              { reps: 13, weight: 3 },
              { reps: 9, weight: 5 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-10`,
            name: 'Triceps',
            sets: [
              { reps: 13, weight: 10 },
              { reps: 13, weight: 10 },
              { reps: 11, weight: 15 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-11`,
            name: 'Biceps',
            sets: [
              { reps: 12, weight: 3 },
              { reps: 12, weight: 3 },
              { reps: 8, weight: 5 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-12`,
            name: 'Ridicari laterale',
            sets: [
              { reps: 13, weight: 3 },
              { reps: 13, weight: 3 },
              { reps: 9, weight: 5 }
            ],
            unit: 'kg',
            notes: ''
          },
          {
            id: `${timestamp}-13`,
            name: 'Lombar',
            sets: [
              { reps: 12, weight: 0 },
              { reps: 12, weight: 0 },
              { reps: 12, weight: 0 }
            ],
            unit: 'kg',
            notes: 'Fara greutate'
          }
        ]
      }
    ];

    await this.saveWorkouts(workouts);
    return workouts;
  }

  async addWorkout(workouts: Workout[], name: string): Promise<Workout[]> {
    const newWorkout: Workout = {
      id: Date.now().toString(),
      name,
      date: new Date().toISOString().split('T')[0],
      exercises: []
    };

    const updatedWorkouts = [...workouts, newWorkout];
    await this.saveWorkouts(updatedWorkouts);
    return updatedWorkouts;
  }

  async deleteWorkout(workouts: Workout[], workoutId: string): Promise<Workout[]> {
    const updatedWorkouts = workouts.filter(w => w.id !== workoutId);
    await this.saveWorkouts(updatedWorkouts);
    return updatedWorkouts;
  }
}