// Human-editable department structure. Keep claims concise and source-based.
window.SCIENCE_DEPARTMENTS = {
  physics: {
    name: "Department of Physics",
    shortName: "Physics",
    strapline: "From fundamental questions to photonic and quantum technologies.",
    introduction: "The Department of Physics brings together teaching, laboratory learning, and research across fundamental, computational, optical, materials, and device physics.",
    source: "https://mitwpu.edu.in/schools/faculty-of-science-and-health-science/school-of-science/department-of-physics",
    programmes: [
      { level: "Undergraduate", name: "B.Sc. Physics (Hons)", url: "https://mitwpu.edu.in/programme/bsc-physics" },
      { level: "Postgraduate", name: "M.Sc. Physics", url: "https://mitwpu.edu.in/programme/msc-physics" },
      { level: "Doctoral", name: "Ph.D. in Physics", url: "https://mitwpu.edu.in/programme/phd-in-physics" }
    ],
    doctoralSupervisors: [
      "Jagadish Hammu Naik",
      "Aavishkar Chittaranjan Katti",
      "Apurv Chaitanya Nellikka",
      "Debabrata Saha",
      "Rahul Ashokrao Aher",
      "Prasad Vivek Joglekar"
    ],
    researchThemes: [
      {
        title: "Quantum, optics & photonics",
        summary: "Nonlinear and quantum optics, structured light, nanophotonics, photonic systems, plasmonics, and spectroscopy.",
        faculty: ["Aavishkar Chittaranjan Katti", "Apurv Chaitanya Nellikka"],
        links: [
          { label: "Photonics Research Group", url: "../../photonics/" },
          { label: "Quantum Science & Technology Group", url: "../../quantum/" }
        ]
      },
      {
        title: "Materials, devices & nanoscience",
        summary: "Semiconductor and dielectric thin films, nanomaterials and nanocomposites, sensors, photodetectors, and functional devices.",
        faculty: ["Debabrata Saha", "Rahul Ashokrao Aher", "Shital Vasant Kahane", "PrasantaKumar Sudarshan Ghosh", "Raju Shivaji Ingale", "Sachin Arun Kulkarni"]
      },
      {
        title: "Astrophysics & fundamental physics",
        summary: "Cosmic magnetic fields, galactic dynamics, high-energy theory, gravitation, and the mathematical structure of fundamental interactions.",
        faculty: ["Abhijit Bendre", "Deobrat Singh"]
      },
      {
        title: "Applied & computational physics",
        summary: "Soft matter, quantum chemistry and computational physics; radiation processing of polymers; liquid acoustics; dielectric spectroscopy; and corrosion science.",
        faculty: ["Anagha Sudhir Karne", "Narendra Laxman Mathakari", "Jagadish Hammu Naik", "Ajit Baburao Deore"]
      }
    ],
    facilities: [
      { name: "Photonics and quantum technologies", note: "Experimental work in photonics and quantum technologies." },
      { name: "Semiconductor device design", note: "Thin-film and semiconductor device experiments and development." },
      { name: "Computational physics", note: "Scientific computing, simulation, and data-led projects." },
      { name: "Astronomy and astrophysics", note: "An optical observatory and radio ground station support astronomy activities." }
    ],
    events: [
      {
        type: "Conference",
        status: "Past",
        title: "International Conference on Recent Technologies and Innovations – Electronics & Photonics (RTEP 2026)",
        dates: "13–14 March 2026",
        year: 2026,
        programme: "Electronics, semiconductors, and photonics",
        url: "https://mitwpu.edu.in/recent-technologies-and-innovations-in-electronics-and-photonics-second-edition"
      }
    ],
    eventSeries: [
      "International Conference on Current Trends in Physics and Photonics",
      "International Conference on Recent Technologies and Innovations – Electronics & Photonics"
    ]
  },

  chemistry: {
    name: "Department of Chemistry",
    shortName: "Chemistry",
    strapline: "Molecular science, functional materials, and chemistry for industry and society.",
    introduction: "The Department of Chemistry combines foundational chemical science and laboratory learning with faculty research in polymer science, synthesis and catalysis, functional and molecular materials, nanomaterials, environmental chemistry, and photonics.",
    source: "https://mitwpu.edu.in/schools/faculty-of-science-and-health-science/school-of-science/department-of-chemistry",
    programmes: [
      { level: "Undergraduate", name: "B.Sc. Chemistry (Hons)", url: "https://mitwpu.edu.in/programme/bsc-chemistry" },
      { level: "Postgraduate", name: "M.Sc. Chemistry (Industrial Polymer Chemistry)", url: "https://mitwpu.edu.in/programme/msc-chemistry-industrial-polymer-chemistry" },
      { level: "Postgraduate", name: "M.Sc. Chemistry (Organic Chemistry)", url: "https://mitwpu.edu.in/programme/msc-chemistry-organic-chemistry" },
    ],
    researchThemes: [
      {
        title: "Nanomaterials, molecular materials & photonics",
        summary: "Nanomaterial synthesis, plasmonics and nanophotonics, metal-organic frameworks, molecular nanomagnets, switches, and fluorescent sensors.",
        faculty: ["Dev Kumar Thapa", "Soumava Biswas"]
      },
      {
        title: "Organic synthesis, catalysis & green chemistry",
        summary: "Synthetic organic chemistry, ionic liquids, organocatalysis, heterogeneous catalysis, asymmetric synthesis, biocatalysis, and green synthesis.",
        faculty: ["Meghana Ganesh Gote", "Parineeta Das"]
      },
      {
        title: "Polymers, coatings & sustainable materials",
        summary: "Liquid-crystalline and conducting polymers, biopolymers, nanocomposites, protective coatings, packaging, microplastics, and water purification.",
        faculty: ["VasiAhmed Ebrahim Shaikh", "Kiran Kisan Kokate", "Vandana Aryan Mooss", "Parineeta Das"]
      },
      {
        title: "Inorganic & environmental chemistry",
        summary: "Metal complexes, wastewater treatment, pollutant degradation, and materials chemistry for environmental applications.",
        faculty: ["Vaishali Hanumant Gaikwad", "Sanjay Babanrao Bhagwat", "Meghana Ganesh Gote"]
      }
    ],
    facilities: [
      { name: "Chemical synthesis and analysis", note: "Laboratory teaching covers organic, inorganic, physical, and analytical chemistry, instrumental methods, and spectroscopic structure determination." },
      { name: "Polymer processing and characterisation", note: "Industrial Polymer Chemistry covers polymer synthesis, processing, raw-material analysis, coatings, testing, and characterisation." }
    ],
    events: [
      {
        type: "Related MIT-WPU conference",
        status: "Past",
        title: "International Conference on Bridging Ancient and Advanced Technology of Nanomaterials",
        dates: "5 September 2024",
        year: 2024,
        programme: "Nanomaterials and advanced materials",
        url: "https://mitwpu.edu.in/events/international-conference-on-bridging-ancient-and-advanced-technology-of-nanomaterials"
      }
    ],
    eventSeries: []
  },

  mathematics: {
    name: "Department of Mathematics and Statistics",
    shortName: "Mathematics & Statistics",
    strapline: "Structure, uncertainty, modelling, and data.",
    introduction: "The Department of Mathematics and Statistics connects rigorous mathematical foundations with statistics, computation, optimisation, data science, and applications across science and engineering.",
    source: "https://mitwpu.edu.in/schools/faculty-of-science-and-health-science/school-of-science/department-of-mathematics-and-statistics",
    programmes: [
      { level: "Undergraduate", name: "B.Sc. Applied Statistics and Data Analytics (Hons)", url: "https://mitwpu.edu.in/programme/bsc-applied-statistics-and-data-analytics" },
      { level: "Postgraduate", name: "M.Sc. Mathematics and Data Science", url: "https://mitwpu.edu.in/programme/msc-mathematics-and-data-science" },
      { level: "Postgraduate", name: "M.Sc. Applied Statistics", url: "https://mitwpu.edu.in/programme/msc-statistics" },
      { level: "Doctoral", name: "Ph.D. in Mathematics", url: "https://mitwpu.edu.in/programme/phd-in-mathematics" },
      { level: "Doctoral", name: "Ph.D. in Statistics", url: "https://mitwpu.edu.in/programme/phd-in-statistics" }
    ],
    doctoralSupervisors: [
      "Prashant Pralhad Malavadkar",
      "Rupal Chandulal Shroff",
      "Akilbasha A",
      "Mukesh Kumar Pal",
      "Priyanka Kumari",
      "Hemant Shripad Kulkarni",
      "Abhishek Singh",
      "Ashok Kumar Jaiswal",
      "Abdul Nasir Khan"
    ],
    researchThemes: [
      {
        title: "Discrete mathematics & combinatorics",
        summary: "Matroid and graph theory, algebra, lattice theory, combinatorics, coding theory, and discrete structures.",
        faculty: ["Prashant Pralhad Malavadkar", "Rupal Chandulal Shroff", "Priyanka Kumari", "Sachin Shivaji Gunjal", "Uday Vilas Jagadale", "Amol Prakash Narke", "Kundan Ramesh Nagare", "Vaishali Manish Joshi"]
      },
      {
        title: "Analysis, modelling & differential equations",
        summary: "Geometric function theory, differential equations, numerical analysis, elastodynamics, wave propagation, fluid mechanics, and mathematical modelling.",
        faculty: ["Mukesh Kumar Pal", "Gajanan Malleshi Birajdar", "Rajashree Sahadeo Jadhav", "Ramaa Ashish Sandu", "Mukund Gokhale", "Vijay Kumar Kalyani"]
      },
      {
        title: "Statistics, data science & machine learning",
        summary: "Sampling, ranked-set sampling, statistical inference, Bayesian methods, statistical genetics, time series, biostatistics, data science, and machine learning.",
        faculty: ["Abdul Nasir Khan", "Abhishek Singh", "Ashok Kumar Jaiswal", "Hemant Shripad Kulkarni", "Umeshkumar Bhaiyalal Dubey"]
      },
      {
        title: "Optimisation & operations research",
        summary: "Optimisation, decision-making, transportation and supply-chain models, and fuzzy and rough sets.",
        faculty: ["Akilbasha A"]
      }
    ],
    facilities: [],
    events: [
      {
        type: "Conference",
        status: "Past",
        title: "90th Annual Conference of the Indian Mathematical Society",
        dates: "23–26 December 2024",
        year: 2024,
        programme: "Mathematics and statistics",
        url: "https://mitwpu.edu.in/events/mit-wpu-successfully-hosts-90th-annual-conference-of-the-indian-mathematical-society"
      }
    ],
    eventSeries: []
  },

  biosciences: {
    name: "Department of Biosciences and Technology",
    shortName: "Biosciences & Technology",
    strapline: "Biological discovery translated into health, agriculture, and sustainable technology.",
    introduction: "The Department of Biosciences and Technology integrates molecular and cellular science, biotechnology, microbiology, bioinformatics, and translational research.",
    source: "https://mitwpu.edu.in/schools/faculty-of-science-and-health-science/school-of-science/department-of-biosciences-and-technology",
    programmes: [
      { level: "Undergraduate", name: "Integrated M.Sc. Biotechnology", url: "https://mitwpu.edu.in/programme/integrated-msc-biotechnology" },
      { level: "Postgraduate", name: "M.Sc. Biotechnology", url: "https://mitwpu.edu.in/programme/msc-biotechnology" },
      { level: "Postgraduate", name: "M.Sc. Microbiology", url: "https://mitwpu.edu.in/programme/msc-microbiology" },
      { level: "Doctoral", name: "Ph.D. in Biochemistry", url: "https://mitwpu.edu.in/programme/phd-in-biochemistry" },
      { level: "Doctoral", name: "Ph.D. in Biotechnology", url: "https://mitwpu.edu.in/programme/phd-in-biotechnology" },
      { level: "Doctoral", name: "Ph.D. in Microbiology", url: "https://mitwpu.edu.in/programme/phd-in-microbiology" }
    ],
    doctoralSupervisors: [
      "Shilpa Samir Chapadgaonkar",
      "Manasi Mishra",
      "Nithya N Kutty",
      "Rehan Deshmukh",
      "Amruta Sameer Naik",
      "Mukul Sacchit Godbole",
      "Shikha Vikrant Gaikwad",
      "Tejaswini Pachpor",
      "Mandar Bopardikar",
      "Bishnudeo Roy",
      "Meenakshi Shankar Iyer",
      "Shalaka Patil",
      "Amit Kumar",
      "Kirtikumar Kondhare",
      "Anup Atul Kale"
    ],
    researchThemes: [
      {
        title: "Cancer, cell & regenerative biology",
        summary: "Cancer cell biology, genome stability, stem cells, tissue engineering, bone biology, and protein aggregation.",
        faculty: ["Shilpa Samir Chapadgaonkar", "Mukul Sacchit Godbole", "Amruta Sameer Naik", "Mandar Bopardikar", "Shalaka Patil"]
      },
      {
        title: "Genomics, bioinformatics & microbiomes",
        summary: "Genomics, transcriptomics, metagenomics, microbial and human microbiomes, protein structure, and computational biology.",
        faculty: ["Kausik Bhattacharyya", "Sachin Harle", "Neha Bokey", "Meenakshi Shankar Iyer"]
      },
      {
        title: "Microbiology, immunology & bioprocessing",
        summary: "Applied and environmental microbiology, immune profiling, microbial metabolites, enzyme technology, and bioprocess development.",
        faculty: ["Shilpa Samir Chapadgaonkar", "Shikha Vikrant Gaikwad", "Tejaswini Pachpor", "Bishnudeo Roy"]
      },
      {
        title: "Plant molecular biology & sustainable biotechnology",
        summary: "Plant development, defence and metabolism; plant–microbe interactions; genome editing; and crop improvement.",
        faculty: ["Nithya N Kutty", "Manasi Mishra", "Amit Kumar", "Kirtikumar Kondhare", "Preethi Sunkara"]
      },
      {
        title: "Biosensors, diagnostics & bioimaging",
        summary: "Electrochemical and optical biosensors, pathogen and molecular diagnostics, bioimaging, and preclinical workflows.",
        faculty: ["Anup Atul Kale", "Rehan Deshmukh", "Kausik Bhattacharyya", "Shalaka Patil"]
      }
    ],
    facilities: [
      { name: "Revvity – MIT-WPU Centre of Excellence for Bioimaging Technologies and Innovation", note: "Confocal microscopy, flow cytometry, live-animal imaging, microfluidics, gene extraction, and advanced imaging software." },
      { name: "Cell culture and tissue engineering", note: "Animal-cell culture, tissue engineering, disease models, and regenerative-biology research." },
      { name: "Molecular biology, bioanalytics and bioinformatics", note: "Molecular and bioanalytical workflows, genomics, and computational bioscience." },
      { name: "Microbial and plant biotechnology", note: "Microbial culture, bioprocessing, plant biotechnology, and applied sustainable bioscience." }
    ],
    events: [
      {
        type: "Partnership",
        status: "Recent",
        title: "Department of Biosciences and Technology signs MoU with Haystack Analytics",
        dates: "17 February 2026",
        year: 2026,
        programme: "Genomics and translational bioscience",
        url: "https://mitwpu.edu.in/news/department-of-biosciences-and-technology-signs-mou-with-haystack-analytics"
      }
    ],
    eventSeries: []
  },

  "environmental-studies": {
    name: "Department of Environmental Studies",
    shortName: "Environmental Studies",
    strapline: "Environmental science, conservation, climate, and sustainability.",
    introduction: "The department offers postgraduate and doctoral study spanning ecology and biodiversity, water and pollution, climate and sustainability, environmental assessment, and applied field research.",
    source: "https://mitwpu.edu.in/schools/faculty-of-science-and-health-science/school-of-science/department-of-environmental-studies",
    programmes: [
      { level: "Postgraduate", name: "M.Sc. Environment Science", url: "https://mitwpu.edu.in/programme/msc-environment-science" },
      { level: "Doctoral", name: "Ph.D. in Environmental Science", url: "https://mitwpu.edu.in/programme/phd-in-environmental-science" }
    ],
    researchThemes: [
      {
        title: "Ecology, biodiversity & conservation",
        summary: "Urban ecology, biogeography, species and habitat conservation, biodiversity informatics, and community-led restoration.",
        faculty: ["Pankaj Pramod Koparde", "Prasad Anil Kulkarni"]
      },
      {
        title: "Water, pollution & environmental engineering",
        summary: "River- and lake-bank filtration, emerging contaminants, water and wastewater treatment, and sustainable water systems.",
        faculty: ["Soma Mishra"]
      },
      {
        title: "Climate action & sustainability assessment",
        summary: "Sustainable development goals, environmental impact assessment, life-cycle assessment, ESG, natural-resource management, and environmental innovation.",
        faculty: ["Prasad Anil Kulkarni"]
      },
      {
        title: "Citizen science & environmental communication",
        summary: "Public participation, biodiversity data, environmental education, and science communication for conservation action.",
        faculty: ["Pankaj Pramod Koparde"]
      }
    ],
    doctoralSupervisors: [],
    facilities: [],
    events: [
      {
        type: "International collaboration",
        status: "Recent",
        title: "Fostering Global Connections: Aalen University’s Inspiring Visit to MIT-WPU",
        dates: "11 March 2025",
        year: 2025,
        programme: "Research collaboration and international exchange",
        url: "https://mitwpu.edu.in/news/fostering-global-connections-aalen-universitys-inspiring-visit-to-mit-wpu"
      },
      {
        type: "Public event",
        status: "Past",
        title: "World Environment Day with Dr. Dev Niyogi",
        dates: "4 June 2024",
        year: 2024,
        programme: "Climate and environmental restoration",
        url: "https://mitwpu.edu.in/events/mit-wpu-celebrates-world-environment-day-with-renowned-climate-scientist-dr-dev-niyogi"
      },
      {
        type: "Conference",
        status: "Past",
        title: "EnviroSummit 2024",
        dates: "1 March 2024",
        year: 2024,
        programme: "Climate Action, Ecology, and the Environment",
        url: "https://mitwpu.edu.in/uploads/notificationfile/Woman-pulse-vol-19.pdf"
      }
    ],
    eventSeries: []
  }
};
