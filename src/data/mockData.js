import { 
  Activity, 
  Baby, 
  Brain, 
  Hand, 
  Home, 
  MessageCircle,
  Stethoscope,
  Heart
} from 'lucide-react';
import drRudha from '../assets/drrudha.png';

export const services = [
  {
    id: "occupational-therapy",
    title: "Occupational Therapy",
    icon: Hand,
    shortDescription: "Empowering individuals to perform daily activities with greater independence.",
    conditions: [
      "Motor skill delays",
      "Sensory processing issues",
      "Post-stroke recovery",
      "Hand injuries"
    ],
    benefits: [
      "Improved fine motor skills",
      "Enhanced daily living activities",
      "Better sensory regulation"
    ],
    process: [
      "Initial Functional Assessment",
      "Customized Intervention Plan",
      "Adaptive Techniques Training",
      "Progress Evaluation"
    ]
  },
  {
    id: "physiotherapy",
    title: "Physiotherapy",
    icon: Activity,
    shortDescription: "Restoring movement and function through evidence-based physical rehabilitation.",
    conditions: [
      "Sports injuries",
      "Post-surgical recovery",
      "Back and neck pain",
      "Arthritis"
    ],
    benefits: [
      "Pain relief",
      "Restored mobility",
      "Improved strength and flexibility"
    ],
    process: [
      "Comprehensive Physical Exam",
      "Targeted Exercise Prescription",
      "Manual Therapy Sessions",
      "Ongoing Monitoring"
    ]
  },
  {
    id: "speech-therapy",
    title: "Speech Therapy",
    icon: MessageCircle,
    shortDescription: "Helping patients overcome communication and swallowing difficulties.",
    conditions: [
      "Speech articulation issues",
      "Language delays",
      "Stuttering",
      "Swallowing disorders (Dysphagia)"
    ],
    benefits: [
      "Clearer speech",
      "Better receptive and expressive language",
      "Safe swallowing techniques"
    ],
    process: [
      "Speech and Language Evaluation",
      "Personalized Therapy Modules",
      "Articulatory Practice",
      "Family Communication Strategies"
    ]
  },
  {
    id: "neuro-rehabilitation",
    title: "Neuro Rehabilitation",
    icon: Brain,
    shortDescription: "Specialized care for neurological disorders to optimize cognitive and physical function.",
    conditions: [
      "Stroke",
      "Traumatic Brain Injury (TBI)",
      "Parkinson's Disease",
      "Multiple Sclerosis"
    ],
    benefits: [
      "Enhanced neuroplasticity",
      "Improved cognitive function",
      "Better balance and coordination"
    ],
    process: [
      "Neurological Assessment",
      "Cognitive and Motor Retraining",
      "Functional Task Practice",
      "Long-term Management Plan"
    ]
  },
  {
    id: "pediatric-rehabilitation",
    title: "Pediatric Rehabilitation",
    icon: Baby,
    shortDescription: "Child-centered therapy focusing on developmental milestones and early intervention.",
    conditions: [
      "Cerebral Palsy",
      "Autism Spectrum Disorder",
      "Developmental Delays",
      "Down Syndrome"
    ],
    benefits: [
      "Achievement of developmental milestones",
      "Improved social interaction",
      "Enhanced physical growth"
    ],
    process: [
      "Play-based Assessment",
      "Family-centered Goal Setting",
      "Interactive Therapy Sessions",
      "Parental Coaching"
    ]
  },
  {
    id: "homecare-services",
    title: "Homecare Services",
    icon: Home,
    shortDescription: "Professional rehabilitation care delivered in the comfort of your own home.",
    conditions: [
      "Post-hospitalization recovery",
      "Elderly care",
      "Severe mobility restrictions",
      "Chronic disease management"
    ],
    benefits: [
      "Convenience and comfort",
      "Personalized 1-on-1 attention",
      "Reduced risk of infection"
    ],
    process: [
      "Home Environment Assessment",
      "Care Plan Coordination",
      "In-home Therapy Sessions",
      "Continuous Progress Reporting"
    ]
  }
];

export const team = [
  {
    id: 1,
    name: "Dr. Rudhananda",
    designation: "Senior Physiotherapist",
    specialization: "Orthopedic & Sports Rehabilitation",
    image: drRudha
  },
  {
    id: 2,
    name: "Dr. Rudhananda",
    designation: "Senior Physiotherapist",
    specialization: "Orthopedic & Sports Rehabilitation",
    image: drRudha
  },
  {
    id: 3,
    name: "Dr. Rudhananda",
    designation: "Senior Physiotherapist",
    specialization: "Orthopedic & Sports Rehabilitation",
    image: drRudha
  },
  {
    id: 4,
    name: "Dr. Rudhananda",
    designation: "Senior Physiotherapist",
    specialization: "Orthopedic & Sports Rehabilitation",
    image: drRudha
  }
];

export const testimonials = [
  {
    id: 1,
    name: "Priya Mohanty",
    condition: "Post-Stroke Recovery",
    quote: "The team at AArambh gave my father his independence back. Their compassionate approach and expertise in neuro-rehab made all the difference."
  },
  {
    id: 2,
    name: "Rahul Verma",
    condition: "Sports Injury",
    quote: "After a severe knee injury, I thought I wouldn't play again. The physiotherapy sessions were rigorous but perfectly tailored to my recovery."
  },
  {
    id: 3,
    name: "Sunita Das",
    condition: "Pediatric Care (Son)",
    quote: "The pediatric therapists are so patient and kind. My son has shown remarkable improvement in his speech and motor skills."
  }
];

export const faqs = [
  {
    question: "Do I need a doctor's referral to book an appointment?",
    answer: "While a doctor's referral is helpful and sometimes required by insurance, you can directly book a consultation with us for an initial assessment."
  },
  {
    question: "Are your services covered by health insurance?",
    answer: "We partner with several major health insurance providers. Please contact our front desk with your policy details so we can verify your coverage."
  },
  {
    question: "How long does a typical therapy session last?",
    answer: "Most individual therapy sessions last between 45 to 60 minutes, depending on the specific treatment plan and patient needs."
  },
  {
    question: "What areas do your homecare services cover?",
    answer: "Our homecare services currently cover major areas within Odisha. Please contact us with your location to confirm availability."
  },
  {
    question: "Can multiple therapies be combined?",
    answer: "Yes, we highly recommend a multidisciplinary approach for many conditions. We can coordinate physiotherapy, occupational therapy, and speech therapy as needed."
  },
  {
    question: "What safety protocols do you follow for in-clinic visits?",
    answer: "We adhere strictly to hygiene and sanitation guidelines, including regular equipment sanitization, mandatory masks, and social distancing protocols where applicable."
  }
];

export const jobs = [
  {
    id: 1,
    title: "Senior Physiotherapist",
    location: "Bhubaneswar, Odisha",
    type: "Full-time",
    description: "We are looking for an experienced physiotherapist with a background in orthopedic rehabilitation to join our expanding team."
  },
  {
    id: 2,
    title: "Occupational Therapist",
    location: "Cuttack, Odisha",
    type: "Full-time",
    description: "Seeking a passionate OT to work primarily with adult neurological patients. Minimum 2 years of experience required."
  },
  {
    id: 3,
    title: "Speech Therapist (Pediatric)",
    location: "Bhubaneswar, Odisha",
    type: "Part-time",
    description: "Join our pediatric team to provide early intervention speech therapy. Flexible hours available."
  }
];

export const partnershipModels = [
  {
    title: "Full Staffing Support",
    description: "We provide complete, trained rehabilitation teams (PT, OT, ST) to integrate seamlessly into your hospital or clinic.",
    features: ["End-to-end HR management", "Quality assurance", "Continuous training"]
  },
  {
    title: "Therapy Consulting",
    description: "Expert guidance to help set up or optimize your existing rehabilitation department.",
    features: ["Equipment recommendations", "Protocol development", "Workflow optimization"]
  },
  {
    title: "Operational Partnership",
    description: "A joint venture approach where we manage the entire rehabilitation operations within your facility.",
    features: ["Revenue sharing", "Brand co-marketing", "Comprehensive management"]
  }
];
