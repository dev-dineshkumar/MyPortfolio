// Single source of truth for all portfolio content.
// Everything below comes from Dinesh Kumar G's resume — nothing is invented.

export const profile = {
  name: 'DINESH KUMAR G',
  shortName: 'DINESH KUMAR G',
  logoFirst: 'D',
  logoRest: 'INESH KUMAR G',
  role: 'Full Stack .NET Developer',
  kicker: 'Full Stack .NET Developer • 4+ Years Experience',
  roles: ['ASP.NET Core', 'React.js'],
  tagline: 'Building secure APIs and responsive interfaces for enterprise College ERP applications.',
  location: 'Coimbatore, Tamil Nadu, India',
  footerAddress: ['Coimbatore- 641032,', 'Tamil Nadu, India.'],
  phone: '9843345537',
  phoneDisplay: '98433 45537',
  phoneHref: 'tel:+919843345537',
  email: 'ananddineshkumar@gmail.com',
  loaderWords: ['EVERY', 'LINE', 'POWERS', 'REAL', 'SOFTWARE'],
}

export const navLinks = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Work' },
  { id: 'tools', label: 'Toolkit' },
  { id: 'services', label: 'Services' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
]

export const stats = [
  { value: 4, suffix: '+', label: 'Years of Experience' },
  { value: 3, suffix: '', label: 'Companies' },
  { value: 4, suffix: '', label: 'ERP Modules' },
]

// Cards that ride the 3D rail in the "Work" section — each maps to real resume content.
export const projectCards = [
  { kind: 'billing', cat: 'ERP Module', title: 'Billing Management', sub: 'Billing operations · Fee-related management', hue: 42 },
  { kind: 'library', cat: 'ERP Module', title: 'Library Management', sub: 'Library operations and management', hue: 214 },
  { kind: 'admission', cat: 'ERP Module', title: 'Admission Management', sub: 'Admission enquiry · Admission processes', hue: 36 },
  { kind: 'transport', cat: 'ERP Module', title: 'Transport Management', sub: 'College transportation operations', hue: 200 },
  { kind: 'auth', cat: 'Security', title: 'JWT Authentication', sub: 'Secured endpoints · User access', hue: 46 },
  { kind: 'api', cat: 'Web API', title: 'RESTful API Development', sub: 'ASP.NET Core · Frontend & business logic', hue: 224 },
  { kind: 'react', cat: 'Frontend', title: 'React.js', sub: 'React.js interfaces · ASP.NET Core APIs', hue: 190 },
  { kind: 'iis', cat: 'Deployment', title: 'IIS Hosting', sub: 'Web APIs hosted for production', hue: 210 },
  { kind: 'edu', cat: 'Education Platform', title: 'Responsive Education UI', sub: 'HTML · CSS · Bootstrap · JavaScript', hue: 48 },
]

export const about = {
  paragraph:
    'Full Stack .NET Developer with 4+ years of experience in designing, developing, and maintaining web applications using C#, ASP.NET Core, Web API, React.js, and Microsoft SQL Server. Experienced in RESTful API development, JWT-based authentication and authorization, and frontend development. Hands-on experience with enterprise College ERP applications — Billing, Library, Admission, and Transport Management modules — and familiar with AI-assisted development tools.',
  pills: [
    'C# & ASP.NET Core',
    'RESTful Web APIs',
    'JWT Authentication',
    'React.js',
    'Microsoft SQL Server',
    'Entity Framework & LINQ',
    'Swagger / OpenAPI',
    'Git & IIS',
  ],
}

export const experience = [
  {
    role: 'Software Developer – Full Stack .NET Developer',
    company: 'Subiksham Software Solutions Pvt Ltd',
    location: 'Coimbatore, Tamil Nadu',
    period: 'Aug 2023 – Present',
    current: true,
    tech: ['C#', 'ASP.NET Core', 'Web API', 'React.js', 'MS SQL Server', 'Entity Framework', 'LINQ', 'JWT', 'Git'],
    points: [
      'Designed, developed, and maintained full-stack web applications using ASP.NET Core Web API and React.js.',
      'Developed and integrated RESTful Web APIs to support frontend functionality and business requirements.',
      'Implemented JWT-based authentication and authorization to secure application endpoints and user access.',
      'Worked with asynchronous programming and LINQ for data processing and API operations.',
      'Designed and maintained SQL Server database objects, including tables, queries, and stored procedures.',
      'Hosted and deployed Web APIs on IIS for application hosting and production environments.',
      'Created and maintained API documentation using Swagger/OpenAPI.',
      'Used Git for source code management and application development workflows.',
      'Utilized AI-assisted development tools, including Cursor and Anthropic Claude SDK, to support software development activities.',
    ],
  },
  {
    role: 'Front End Developer',
    company: 'Novitech R&D',
    location: 'Coimbatore, Tamil Nadu',
    period: 'Nov 2022 – May 2023',
    current: false,
    tech: ['HTML', 'CSS', 'Bootstrap', 'JavaScript', 'AWS (Basic Knowledge)'],
    points: [
      'Developed and maintained web interfaces for an Education Platform project.',
      'Designed responsive website layouts using HTML, CSS, Bootstrap, and JavaScript.',
      'Integrated data from various services and databases into frontend applications.',
      'Developed and maintained client-side functionality.',
      'Reviewed and maintained frontend code to support usability and browser compatibility.',
      'Gained basic knowledge of AWS Cloud Computing.',
    ],
  },
  {
    role: 'Junior Front End Developer',
    company: 'Curzor Tech',
    location: 'Coimbatore, Tamil Nadu',
    period: 'Mar 2022 – Aug 2022',
    current: false,
    tech: ['HTML', 'CSS', 'JavaScript'],
    points: [
      'Developed client-side web interfaces using HTML, CSS, and JavaScript.',
      'Optimized web page layouts and presentation for improved usability.',
      'Tested websites for functionality, usability, and browser compatibility.',
      'Supported frontend development and website maintenance activities.',
    ],
  },
]

export const services = [
  {
    title: 'Full-Stack Web Application Development',
    badge: 'Core',
    text: 'Designing, developing and maintaining web applications with ASP.NET Core Web API and React.js.',
    stack: 'ASP.NET Core + React',
  },
  {
    title: 'RESTful Web API Development',
    text: 'Building and integrating RESTful Web APIs that support frontend functionality and business requirements.',
    stack: 'C# · Web API',
  },
  {
    title: 'JWT Authentication & Authorization',
    text: 'Securing application endpoints and user access with JWT-based authentication and authorization.',
    stack: 'JWT',
  },
  {
    title: 'React.js Frontend Development',
    text: 'Responsive interfaces built with React.js, HTML5, CSS3, Bootstrap and JavaScript, integrated with Web APIs.',
    stack: 'React.js',
  },
  {
    title: 'SQL Server Database Development',
    text: 'SQL Server tables, queries and stored procedures, with LINQ and Entity Framework for data access.',
    stack: 'SQL Server · EF',
  },
  {
    title: 'API Documentation & IIS Hosting',
    text: 'Swagger / OpenAPI documentation, plus hosting and deploying Web APIs on IIS for production.',
    stack: 'Swagger · IIS',
  },
]

// `since` and `w` (meter width) are derived from the resume timeline:
// frontend basics since Mar 2022 (≈4 yrs), .NET / React / SQL Server stack since Aug 2023.
export const skills = [
  { title: 'C# · ASP.NET Core Web API', small: 'Backend', since: 'Since 2025', w: 78 },
  { title: 'React.js', small: 'Frontend', since: 'Since 2025', w: 78 },
  { title: 'HTML5 · CSS3 · Bootstrap · JS', small: 'Frontend Foundations', since: 'Since 2022', w: 100 },
  { title: 'Microsoft SQL Server', small: 'Database · Stored Procedures', since: 'Since 2023', w: 78 },
  { title: 'Entity Framework · LINQ', small: 'Data Access', since: 'Since 2025', w: 78 },
  { title: 'JWT Auth & Authorization', small: 'Security', since: 'Since 2025', w: 78 },
  { title: 'REST APIs · Swagger / OpenAPI', small: 'API Design & Docs', since: 'Since 2025', w: 78 },
  { title: 'AI-Assisted Development', small: 'Cursor · Claude SDK', since: 'Since 2025', w: 78 },
]

// [name, 2-letter badge, badge text colour, badge background]
export const tools = [
  ['Visual Studio', 'VS', '#e9d5ff', '#2d1250'],
  ['VS Code', 'VC', '#9bd0ff', '#0b2540'],
  ['Git', 'Gt', '#ffd0b8', '#4a1c0a'],
  ['Postman', 'Pm', '#fff', '#e8590c'],
  ['Swagger / OpenAPI', 'Sw', '#0b2a12', '#85ea2d'],
  ['IIS', 'II', '#9bc8ff', '#0a2447'],
  ['Cursor', 'Cu', '#fff', '#2b2f36'],
  ['Claude SDK', 'Cl', '#fff', '#c96a3d'],
  ['React.js', 'Re', '#0b2a33', '#61dafb'],
  ['ASP.NET Core', '.N', '#fff', '#512bd4'],
  ['SQL Server', 'Sq', '#ffd0d0', '#4a0f12'],
  ['Entity Framework', 'EF', '#d9d0ff', '#241a52'],
  ['JWT', 'JW', '#fff', '#d63aff'],
  ['Bootstrap', 'Bs', '#fff', '#7952b3'],
]

export const education = [
  {
    title: 'Bachelor of Computer Applications (BCA)',
    small: 'VLB Janakiammal College of Arts and Science, Coimbatore',
    chip: '2017 – 2020',
  },
  {
    title: 'SELEST – An Innovation Towards Automation',
    small: 'National-Level Workshop · AJK College of Arts and Science',
    chip: 'Participant',
  },
  { title: 'Tamil · English', small: 'Languages', chip: 'Speaking & Writing' },
  { title: 'Kannada · Malayalam', small: 'Languages', chip: 'Speaking' },
]
