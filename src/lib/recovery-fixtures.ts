import type { StudentContext, Task } from "@/types/recovery";

const isoIn = (hours: number) => {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const uid = () => crypto.randomUUID();

export interface RecoveryFixture {
  label: string;
  context: StudentContext;
  tasks: Task[];
}

export const normalWorkloadDemo: RecoveryFixture = {
  label: "Normal Workload",
  context: {
    currentDate: today(),
    hoursToday: 4,
    hoursTomorrow: 5,
    energy: "high",
    stress: "low",
    fixedCommitments: "Class 10am–12pm, gym 6–7pm",
  },
  tasks: [
    {
      id: uid(),
      name: "Reading response — Chapter 4",
      course: "PHIL 110",
      dueAt: isoIn(30),
      hoursRemaining: 1.5,
      progress: 20,
      importance: "low",
      difficulty: "easy",
      notes: "Just need to finish reading and write 300 words.",
    },
    {
      id: uid(),
      name: "Problem set 3",
      course: "MATH 220",
      dueAt: isoIn(46),
      hoursRemaining: 2,
      progress: 40,
      importance: "medium",
      difficulty: "medium",
      notes: "Stuck on problem 5.",
    },
  ],
};

export const messyInputDemo: RecoveryFixture = {
  label: "Messy Student Input",
  context: {
    currentDate: today(),
    hoursToday: 3,
    hoursTomorrow: 4,
    energy: "medium",
    stress: "medium",
    fixedCommitments: "work shift maybe? class 2pm",
  },
  tasks: [
    {
      id: uid(),
      name: "Essay thing",
      course: "ENG 200",
      dueAt: isoIn(26),
      hoursRemaining: 3,
      progress: 5,
      importance: "high",
      difficulty: "hard",
      notes: "Professor said it's due 'soon'. Thesis unclear.",
    },
    {
      id: uid(),
      name: "Group slides",
      course: "BUS 250",
      dueAt: isoIn(20),
      hoursRemaining: 2.5,
      progress: 10,
      importance: "medium",
      difficulty: "medium",
      notes: "Two teammates haven't responded.",
    },
    {
      id: uid(),
      name: "Lab notebook update",
      course: "CHEM 101",
      dueAt: isoIn(40),
      hoursRemaining: 1.5,
      progress: 0,
      importance: "low",
      difficulty: "easy",
      notes: "Forgot which experiment we did.",
    },
  ],
};

export const overloadFailureDemo: RecoveryFixture = {
  label: "Overload Failure",
  context: {
    currentDate: today(),
    hoursToday: 2,
    hoursTomorrow: 3,
    energy: "low",
    stress: "high",
    fixedCommitments: "Work shift 1–8pm today, class 9–12 tomorrow",
  },
  tasks: [
    {
      id: uid(),
      name: "Term paper — final draft",
      course: "HIST 305",
      dueAt: isoIn(22),
      hoursRemaining: 8,
      progress: 15,
      importance: "high",
      difficulty: "hard",
      notes: "Thesis still unclear, need sources.",
    },
    {
      id: uid(),
      name: "Calculus midterm prep",
      course: "MATH 241",
      dueAt: isoIn(36),
      hoursRemaining: 6,
      progress: 10,
      importance: "high",
      difficulty: "hard",
      notes: "Haven't reviewed integration techniques.",
    },
    {
      id: uid(),
      name: "Programming assignment 4",
      course: "CS 200",
      dueAt: isoIn(14),
      hoursRemaining: 5,
      progress: 25,
      importance: "high",
      difficulty: "hard",
      notes: "Recursion edge cases failing.",
    },
    {
      id: uid(),
      name: "Spanish oral presentation",
      course: "SPAN 120",
      dueAt: isoIn(30),
      hoursRemaining: 3,
      progress: 0,
      importance: "medium",
      difficulty: "medium",
      notes: "Need to memorize script.",
    },
  ],
};
