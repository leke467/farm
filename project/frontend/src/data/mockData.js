// Mock data for the farm management application

// Users data (for demo purposes)
export const users = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@example.com',
    role: 'Admin',
    lastLogin: '2023-05-04T08:30:00'
  },
  {
    id: '2',
    username: 'demo',
    password: 'demo123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'Manager',
    lastLogin: '2023-05-03T16:45:00'
  }
];

// Rest of the mock data remains unchanged
export const animals = [
  {
    id: '1',
    name: 'Bella',
    type: 'Cow',
    breed: 'Holstein',
    birthDate: '2020-05-15',
    gender: 'Female',
    weight: 1200,
    status: 'Healthy',
    notes: 'Producing milk, last vaccination on 2023-03-10',
    foodConsumption: [
      { date: '2023-05-01', amount: 25 },
      { date: '2023-05-02', amount: 26 },
      { date: '2023-05-03', amount: 24 }
    ],
    weightHistory: [
      { date: '2023-01-01', weight: 1150 },
      { date: '2023-02-01', weight: 1165 },
      { date: '2023-03-01', weight: 1180 },
      { date: '2023-04-01', weight: 1195 },
      { date: '2023-05-01', weight: 1200 }
    ],
    medicalHistory: [
      { date: '2023-03-10', treatment: 'Annual vaccination', notes: 'No adverse reactions' },
      { date: '2022-11-15', treatment: 'Deworming', notes: 'Routine treatment' }
    ]
  },
  {
    id: '2',
    name: 'Max',
    type: 'Cow',
    breed: 'Angus',
    birthDate: '2019-08-20',
    gender: 'Male',
    weight: 1350,
    status: 'Healthy',
    notes: 'Breeding bull',
    foodConsumption: [
      { date: '2023-05-01', amount: 30 },
      { date: '2023-05-02', amount: 28 },
      { date: '2023-05-03', amount: 29 }
    ],
    weightHistory: [
      { date: '2023-01-01', weight: 1320 },
      { date: '2023-02-01', weight: 1330 },
      { date: '2023-03-01', weight: 1335 },
      { date: '2023-04-01', weight: 1345 },
      { date: '2023-05-01', weight: 1350 }
    ],
    medicalHistory: [
      { date: '2023-02-15', treatment: 'Annual vaccination', notes: 'No issues' },
      { date: '2022-08-10', treatment: 'Hoof trimming', notes: 'Routine maintenance' }
    ]
  },
  {
    id: '3',
    name: 'Daisy',
    type: 'Goat',
    breed: 'Alpine',
    birthDate: '2021-03-10',
    gender: 'Female',
    weight: 120,
    status: 'Healthy',
    notes: 'Milk producer, friendly',
    foodConsumption: [
      { date: '2023-05-01', amount: 4 },
      { date: '2023-05-02', amount: 4.5 },
      { date: '2023-05-03', amount: 4 }
    ],
    weightHistory: [
      { date: '2023-01-01', weight: 110 },
      { date: '2023-02-01', weight: 112 },
      { date: '2023-03-01', weight: 115 },
      { date: '2023-04-01', weight: 118 },
      { date: '2023-05-01', weight: 120 }
    ],
    medicalHistory: [
      { date: '2023-04-05', treatment: 'Vaccination', notes: 'Routine vaccination' },
      { date: '2022-12-20', treatment: 'Deworming', notes: 'Preventative treatment' }
    ]
  },
  {
    id: '4',
    name: 'Flock A',
    type: 'Chicken',
    breed: 'Leghorn',
    birthDate: '2023-01-15',
    gender: 'Mixed',
    count: 500,
    avgWeight: 4.2,
    status: 'Healthy',
    notes: 'Egg production flock',
    isGroup: true,
    sampleWeights: [
      { date: '2023-04-15', samples: [4.0, 4.1, 4.3, 4.2, 4.5, 4.0, 4.2, 4.3, 4.1, 4.0] },
      { date: '2023-05-01', samples: [4.1, 4.2, 4.3, 4.2, 4.4, 4.1, 4.3, 4.4, 4.2, 4.1] }
    ],
    foodConsumption: [
      { date: '2023-05-01', amount: 50 },
      { date: '2023-05-02', amount: 52 },
      { date: '2023-05-03', amount: 51 }
    ],
    healthRecords: [
      { date: '2023-03-20', issue: 'Routine check', notes: 'All birds appear healthy' },
      { date: '2023-02-05', issue: 'Vaccination', notes: 'Entire flock vaccinated' }
    ]
  },
  {
    id: '5',
    name: 'Pond A',
    type: 'Fish',
    breed: 'Tilapia',
    establishedDate: '2023-02-01',
    count: 1000,
    avgWeight: 0.8,
    status: 'Healthy',
    notes: 'Growing well in main pond',
    isGroup: true,
    sampleWeights: [
      { date: '2023-04-01', samples: [0.7, 0.75, 0.8, 0.82, 0.79, 0.81, 0.78, 0.76, 0.8, 0.83] },
      { date: '2023-05-01', samples: [0.8, 0.85, 0.82, 0.84, 0.81, 0.83, 0.8, 0.79, 0.82, 0.85] }
    ],
    foodConsumption: [
      { date: '2023-05-01', amount: 8 },
      { date: '2023-05-02', amount: 8 },
      { date: '2023-05-03', amount: 8.2 }
    ],
    waterQuality: [
      { date: '2023-05-01', ph: 7.2, temperature: 78, oxygen: 6.5 },
      { date: '2023-04-15', ph: 7.1, temperature: 77, oxygen: 6.3 }
    ]
  }
];

export const crops = [
  {
    id: '1',
    name: 'Corn',
    field: 'Field A',
    area: 5, // acres
    plantedDate: '2023-04-10',
    expectedHarvestDate: '2023-08-20',
    status: 'Growing',
    stage: 'Vegetative',
    notes: 'Good growth, some weeds to manage',
    tasks: ['Fertilize by May 15', 'Check for pests weekly'],
    growthStages: [
      { 
        stage: 'Planting', 
        date: '2023-04-10',
        completed: true,
        notes: 'Planted during ideal weather conditions'
      },
      { 
        stage: 'Emergence', 
        date: '2023-04-20',
        completed: true,
        notes: 'Good emergence rate, approximately 90%'
      },
      { 
        stage: 'Vegetative', 
        date: '2023-05-15',
        completed: false,
        notes: 'Currently in vegetative stage, growing well'
      },
      { 
        stage: 'Reproductive', 
        date: '2023-06-20',
        completed: false,
        notes: ''
      },
      { 
        stage: 'Maturation', 
        date: '2023-08-01',
        completed: false,
        notes: ''
      },
      { 
        stage: 'Harvest', 
        date: '2023-08-20',
        completed: false,
        notes: ''
      }
    ]
  },
  {
    id: '2',
    name: 'Soybeans',
    field: 'Field B',
    area: 4, // acres
    plantedDate: '2023-05-05',
    expectedHarvestDate: '2023-10-15',
    status: 'Growing',
    stage: 'Early Growth',
    notes: 'Healthy seedlings, good moisture levels',
    tasks: ['Apply herbicide by May 20', 'Monitor for aphids'],
    growthStages: [
      { 
        stage: 'Planting', 
        date: '2023-05-05',
        completed: true,
        notes: 'Planted with precision seeder'
      },
      { 
        stage: 'Emergence', 
        date: '2023-05-15',
        completed: true,
        notes: 'Even emergence across the field'
      },
      { 
        stage: 'Early Growth', 
        date: '2023-06-01',
        completed: false,
        notes: 'Plants developing well with adequate rainfall'
      },
      { 
        stage: 'Flowering', 
        date: '2023-07-15',
        completed: false,
        notes: ''
      },
      { 
        stage: 'Pod Development', 
        date: '2023-08-15',
        completed: false,
        notes: ''
      },
      { 
        stage: 'Maturation', 
        date: '2023-09-30',
        completed: false,
        notes: ''
      },
      { 
        stage: 'Harvest', 
        date: '2023-10-15',
        completed: false,
        notes: ''
      }
    ]
  },
  {
    id: '3',
    name: 'Tomatoes',
    field: 'Greenhouse 1',
    area: 0.5, // acres
    plantedDate: '2023-03-15',
    expectedHarvestDate: '2023-06-30',
    status: 'Growing',
    stage: 'Fruiting',
    notes: 'Some plants showing signs of fungal disease, treating with organic fungicide',
    tasks: ['Prune suckers weekly', 'Apply calcium to prevent blossom end rot'],
    growthStages: [
      { 
        stage: 'Seeding', 
        date: '2023-02-01',
        completed: true,
        notes: 'Seeds started in greenhouse'
      },
      { 
        stage: 'Transplanting', 
        date: '2023-03-15',
        completed: true,
        notes: 'Transplanted to larger containers'
      },
      { 
        stage: 'Vegetative', 
        date: '2023-04-10',
        completed: true,
        notes: 'Healthy growth, regular fertilization'
      },
      { 
        stage: 'Flowering', 
        date: '2023-04-30',
        completed: true,
        notes: 'Good flower set'
      },
      { 
        stage: 'Fruiting', 
        date: '2023-05-20',
        completed: false,
        notes: 'First fruits developing, some showing BER, applying calcium'
      },
      { 
        stage: 'Harvest', 
        date: '2023-06-30',
        completed: false,
        notes: ''
      }
    ]
  }
];

export const tasks = [
  {
    id: '1',
    title: 'Feed livestock',
    description: 'Morning feeding for all cattle and goats',
    dueDate: '2023-05-06T07:00:00',
    status: 'completed',
    priority: 'high',
    assignedTo: 'John Doe',
    category: 'Daily Care',
    relatedTo: 'Animals',
    recurring: true,
    recurrencePattern: 'daily'
  },
  {
    id: '2',
    title: 'Check irrigation system',
    description: 'Inspect Field A and B irrigation lines for leaks or blockages',
    dueDate: '2023-05-05T10:00:00',
    status: 'completed',
    priority: 'medium',
    assignedTo: 'Sarah Johnson',
    category: 'Maintenance',
    relatedTo: 'Crops',
    recurring: true,
    recurrencePattern: 'weekly'
  },
  {
    id: '3',
    title: 'Fertilize corn',
    description: 'Apply nitrogen fertilizer to Field A corn crop',
    dueDate: '2023-05-15T09:00:00',
    status: 'pending',
    priority: 'high',
    assignedTo: 'John Doe',
    category: 'Crop Care',
    relatedTo: 'Crops',
    recurring: false,
    notes: 'Use organic fertilizer, 50 lbs per acre'
  },
  {
    id: '4',
    title: 'Vaccinate cattle',
    description: 'Annual vaccination for the entire herd',
    dueDate: '2023-05-12T14:00:00',
    status: 'pending',
    priority: 'high',
    assignedTo: 'Veterinarian',
    category: 'Health',
    relatedTo: 'Animals',
    recurring: false,
    notes: 'Vet appointment confirmed. Need to prepare handling facilities.'
  },
  {
    id: '5',
    title: 'Repair north fence',
    description: 'Fix damaged sections of the north pasture fence',
    dueDate: '2023-05-08T13:00:00',
    status: 'pending',
    priority: 'medium',
    assignedTo: 'Mike Wilson',
    category: 'Maintenance',
    relatedTo: 'Infrastructure',
    recurring: false,
    notes: 'Need to purchase 10 fence posts and 100ft of wire'
  },
  {
    id: '6',
    title: 'Meet with organic certifier',
    description: 'Annual organic certification inspection',
    dueDate: '2023-05-20T10:00:00',
    status: 'pending',
    priority: 'high',
    assignedTo: 'Sarah Johnson',
    category: 'Administrative',
    relatedTo: 'Farm',
    recurring: false,
    notes: 'Prepare all records from the past year'
  }
];

export const inventory = [
  {
    id: '1',
    name: 'Cattle Feed',
    category: 'Feed',
    quantity: 2000,
    unit: 'lbs',
    location: 'Main Barn',
    minQuantity: 500,
    purchaseDate: '2023-04-15',
    expiryDate: '2023-07-15',
    notes: 'Organic certified feed'
  },
  {
    id: '2',
    name: 'Chicken Feed',
    category: 'Feed',
    quantity: 500,
    unit: 'lbs',
    location: 'Poultry Shed',
    minQuantity: 100,
    purchaseDate: '2023-04-20',
    expiryDate: '2023-08-20',
    notes: 'Layer feed with calcium supplement'
  },
  {
    id: '3',
    name: 'Organic Fertilizer',
    category: 'Fertilizer',
    quantity: 20,
    unit: 'bags',
    location: 'Storage Shed',
    minQuantity: 5,
    purchaseDate: '2023-03-10',
    expiryDate: '2024-03-10',
    notes: 'Each bag covers approximately 1/4 acre'
  },
  {
    id: '4',
    name: 'Veterinary Supplies',
    category: 'Medical',
    quantity: 1,
    unit: 'kit',
    location: 'Office Cabinet',
    minQuantity: 1,
    purchaseDate: '2023-02-05',
    expiryDate: '2024-02-05',
    notes: 'Contains basic medications, bandages, and thermometer'
  },
  {
    id: '5',
    name: 'Fence Posts',
    category: 'Infrastructure',
    quantity: 25,
    unit: 'pieces',
    location: 'Tool Shed',
    minQuantity: 10,
    purchaseDate: '2023-03-20',
    expiryDate: null,
    notes: 'Treated wood, 8ft length'
  },
  {
    id: '6',
    name: 'Diesel Fuel',
    category: 'Fuel',
    quantity: 100,
    unit: 'gallons',
    location: 'Fuel Tank',
    minQuantity: 30,
    purchaseDate: '2023-04-25',
    expiryDate: null,
    notes: 'For tractor and generator'
  }
];

export const expenses = [
  {
    id: '1',
    date: '2023-04-15',
    category: 'Feed',
    description: 'Cattle feed purchase',
    amount: 1200.00,
    vendor: 'County Feed Supply',
    paymentMethod: 'Credit Card',
    receipt: 'receipt_1.pdf',
    notes: 'Organic certified feed, 2-month supply'
  },
  {
    id: '2',
    date: '2023-04-01',
    category: 'Labor',
    description: 'Monthly salary - Farm hand',
    amount: 2500.00,
    vendor: 'John Doe',
    paymentMethod: 'Bank Transfer',
    receipt: 'payslip_april_john.pdf',
    notes: 'Full-time employee, includes overtime'
  },
  {
    id: '3',
    date: '2023-04-05',
    category: 'Equipment',
    description: 'Tractor maintenance',
    amount: 450.00,
    vendor: 'Farm Equipment Services',
    paymentMethod: 'Check',
    receipt: 'receipt_tractor_service.pdf',
    notes: 'Oil change, filter replacement, and general service'
  },
  {
    id: '4',
    date: '2023-04-10',
    category: 'Utilities',
    description: 'Electricity bill',
    amount: 325.00,
    vendor: 'Power Company',
    paymentMethod: 'Bank Transfer',
    receipt: 'electricity_bill_april.pdf',
    notes: 'Farm and residence combined'
  },
  {
    id: '5',
    date: '2023-04-12',
    category: 'Seeds',
    description: 'Corn and soybean seeds',
    amount: 1800.00,
    vendor: 'Agricultural Supply Co.',
    paymentMethod: 'Credit Card',
    receipt: 'seed_purchase_receipt.pdf',
    notes: 'Enough for Field A and B'
  },
  {
    id: '6',
    date: '2023-04-20',
    category: 'Veterinary',
    description: 'Routine cattle checkup',
    amount: 350.00,
    vendor: 'Valley Veterinary Clinic',
    paymentMethod: 'Credit Card',
    receipt: 'vet_invoice_april.pdf',
    notes: 'Annual health checks for breeding stock'
  },
  {
    id: '7',
    date: '2023-04-25',
    category: 'Fuel',
    description: 'Diesel for tractor and equipment',
    amount: 280.00,
    vendor: 'Rural Fuels Inc.',
    paymentMethod: 'Credit Card',
    receipt: 'fuel_receipt_april.pdf',
    notes: '100 gallons'
  }
];

export const weatherData = {
  current: {
    date: '2023-05-05',
    condition: 'Partly Cloudy',
    temperature: 72,
    humidity: 65,
    windSpeed: 8,
    windDirection: 'NW',
    precipitation: 0,
    icon: 'partly-cloudy'
  },
  forecast: [
    {
      date: '2023-05-06',
      condition: 'Sunny',
      highTemp: 75,
      lowTemp: 55,
      precipitation: 0,
      icon: 'sunny'
    },
    {
      date: '2023-05-07',
      condition: 'Mostly Sunny',
      highTemp: 78,
      lowTemp: 58,
      precipitation: 0,
      icon: 'mostly-sunny'
    },
    {
      date: '2023-05-08',
      condition: 'Chance of Rain',
      highTemp: 72,
      lowTemp: 60,
      precipitation: 40,
      icon: 'chance-rain'
    },
    {
      date: '2023-05-09',
      condition: 'Rain',
      highTemp: 68,
      lowTemp: 58,
      precipitation: 80,
      icon: 'rain'
    },
    {
      date: '2023-05-10',
      condition: 'Partly Cloudy',
      highTemp: 70,
      lowTemp: 56,
      precipitation: 20,
      icon: 'partly-cloudy'
    }
  ]
};