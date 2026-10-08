import type { QuizQuestion } from "./types";

const en: QuizQuestion[] = [
  {
    id: "dog-freeze",
    species: "dog",
    q: "During a walk, a dog suddenly freezes, stares at another dog and raises its hackles. What should you do first?",
    options: [
      "Shout 'NO!' loudly to interrupt the behaviour",
      "Calmly create distance and redirect the dog away from the other dog",
      "Walk straight towards the other dog to show leadership",
      "Pet the dog repeatedly to reassure it",
    ],
    correct: 1,
    explain:
      "Freezing, hard staring and raised hackles are signs of rising tension. The safest response is to calmly increase distance and redirect attention.",
  },
  {
    id: "dog-calming",
    species: "dog",
    q: "A stranger reaches to pet a dog. The dog yawns, licks its lips and turns its head away. What is the dog telling you?",
    options: [
      "It is tired and sleepy",
      "It is hungry",
      "It is stressed and asking for space",
      "It is being playful",
    ],
    correct: 2,
    explain:
      "Yawning, lip licking and head turning are classic calming signals — the dog feels uncomfortable and wants the interaction to stop.",
  },
  {
    id: "dog-greeting",
    species: "dog",
    q: "What is the safest way to greet an unfamiliar dog?",
    options: [
      "Approach quickly and pet the top of its head",
      "Stand still, avoid direct eye contact and let the dog approach and sniff you first",
      "Make excited high-pitched noises so the dog knows you are friendly",
      "Reach out and hug the dog to show affection",
    ],
    correct: 1,
    explain:
      "Letting the dog choose to approach, with a relaxed posture and no direct eye contact, gives it control and prevents fear reactions.",
  },
  {
    id: "dog-tail",
    species: "dog",
    q: "A dog's tail is wagging. What does this mean?",
    options: [
      "The dog is always friendly and happy",
      "The dog is definitely scared",
      "A wagging tail can signal different emotions — read the whole body and context",
      "The dog wants to play fetch",
    ],
    correct: 2,
    explain:
      "Tail wagging expresses arousal, not necessarily friendliness. A stiff, high, fast wag can precede aggression — always read the whole body.",
  },
  {
    id: "dog-chocolate",
    species: "dog",
    q: "A dog in your care has eaten chocolate. What is the correct action?",
    options: [
      "Wait and see if it shows symptoms before acting",
      "Give it plenty of water and its normal dinner",
      "Induce vomiting yourself with home remedies",
      "Contact a vet or pet emergency line immediately with the type and amount eaten",
    ],
    correct: 3,
    explain:
      "Chocolate is toxic to dogs and symptoms can be delayed. Fast action matters — call a vet immediately; never induce vomiting without veterinary guidance.",
  },
  {
    id: "cat-overstimulation",
    species: "cat",
    q: "While being petted, a cat suddenly flicks its tail rapidly and flattens its ears back. What does this mean?",
    options: [
      "The cat is overstimulated — stop petting and give it space",
      "The cat is purring along and enjoying it",
      "The cat wants more vigorous petting",
      "The cat is inviting play",
    ],
    correct: 0,
    explain:
      "Rapid tail flicking and flattened ears are early warning signs of overstimulation. Continuing can lead to a scratch or bite.",
  },
  {
    id: "cat-petting",
    species: "cat",
    q: "Where do most cats prefer to be petted?",
    options: [
      "The belly",
      "The paws",
      "The base of the tail",
      "The cheeks, chin and base of the ears",
    ],
    correct: 3,
    explain:
      "Cats have scent glands on their cheeks, chin and head — most enjoy gentle petting there. The belly is a sensitive area many cats protect.",
  },
  {
    id: "cat-hiding",
    species: "cat",
    q: "A cat you are sitting is new to your home and hides under the bed. What is the best approach?",
    options: [
      "Pull the cat out so it gets used to you quickly",
      "Block the hiding spot so it cannot hide",
      "Leave it alone, keep food, water and litter nearby, and let it come out in its own time",
      "Loudly call its name repeatedly until it responds",
    ],
    correct: 2,
    explain:
      "Hiding is a normal coping response. Forcing contact increases stress; a quiet setup and patience let the cat build confidence at its own pace.",
  },
  {
    id: "cat-blink",
    species: "cat",
    q: "A cat slowly blinks at you. What is the best response?",
    options: [
      "Stare back intensely to establish trust",
      "Slowly blink back",
      "Blink rapidly to mirror excitement",
      "Ignore it — it means nothing",
    ],
    correct: 1,
    explain:
      "Slow blinking is a friendly, non-threatening signal. Blinking back communicates relaxation and trust in the cat's own language.",
  },
  {
    id: "cat-kneading",
    species: "cat",
    q: "A cat rhythmically presses its front paws against you ('kneading'). What does this behaviour mean?",
    options: [
      "It is trying to hurt you",
      "It is marking you as territory only",
      "It is a comfort and contentment behaviour carried over from kittenhood",
      "It is asking for food",
    ],
    correct: 2,
    explain:
      "Kneading stems from nursing as a kitten and is usually a sign the cat feels safe and content.",
  },
];

export default en;
