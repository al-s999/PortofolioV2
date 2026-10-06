UPDATE about_me
SET education = '[
  {
    "degree": "Bachelor of Computer Science",
    "institution": "University of Technology",
    "year": "2015 - 2019",
    "description": "Focused on Software Engineering, Algorithms, and Data Structures."
  }
]'::jsonb,
experience = '[
  {
    "role": "Senior Full Stack Developer",
    "company": "Tech Company Inc.",
    "year": "2022 - Present",
    "description": "Leading development of scalable web applications using React, Node.js, and cloud technologies.",
    "technologies": ["React", "TypeScript", "Node.js", "AWS", "PostgreSQL"]
  },
  {
    "role": "Full Stack Developer",
    "company": "Startup XYZ",
    "year": "2020 - 2022",
    "description": "Built and maintained multiple client projects from concept to deployment.",
    "technologies": ["React Native", "Expo", "Firebase", "GraphQL"]
  },
  {
    "role": "Junior Frontend Developer",
    "company": "Digital Agency",
    "year": "2019 - 2020",
    "description": "Developed responsive websites and web applications for various clients.",
    "technologies": ["HTML/CSS", "JavaScript", "Vue.js", "WordPress"]
  }
]'::jsonb;
