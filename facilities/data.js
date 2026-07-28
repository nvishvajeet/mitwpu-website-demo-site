window.MITWPU_CRF = {
  updated: "23 July 2026",
  /* -- a source that is not a captured page ---------------------------------
   *
   * Every other fact on this site was read off a page the university
   * published, and cites the captured URL it was read from. The operator
   * assignments below were not: they come from a spreadsheet the university
   * handed over, which has no URL and no capture date to cite. That is a
   * different kind of evidence, so it is recorded as one rather than dressed
   * up as a citation — the same distinction tools/intranet_page.mjs draws
   * when a contact detail cites a registered service instead of a route.
   *
   * `credit` is the line the pages print. It is here, once, because the
   * capability pages, the instruments page and the people page all print it
   * and three copies of a provenance statement is how one of them ends up
   * saying something the other two do not.
   */
  suppliedSources: {
    "crf-instrument-operators-2026-07-27": {
      title: "Instrument operators, Department of Research & Development",
      file: "docs/sources/crf-instrument-operators-2026-07-27.xlsx",
      supplied: "27 July 2026",
      credit:
        "Operator assignments are from the instrument operator list of the "
        + "Department of Research & Development, supplied by the university "
        + "on 27 July 2026."
    }
  },
  /* -- the operators --------------------------------------------------------
   *
   * A name, the honorific the source wrote, and where the name came from.
   * Nothing else, and the builder enforces "nothing else" rather than
   * trusting this comment: no email, no telephone, no room, no department,
   * no title, no qualification, no photograph. The spreadsheet holds none of
   * them, and this project has already published six invented affiliations
   * and one false doctorate by filling a plausible-looking blank.
   *
   * Order is the order the names first appear in the source.
   */
  operators: [
    {
      id: "ranjit-kate",
      name: "Mr. Ranjit Kate",
      source: "crf-instrument-operators-2026-07-27"
    },
    {
      id: "santosh-patil",
      name: "Dr. Santosh Patil",
      source: "crf-instrument-operators-2026-07-27"
    },
    {
      id: "aparna-potdar",
      name: "Mrs. Aparna Potdar",
      source: "crf-instrument-operators-2026-07-27"
    },
    {
      id: "vrushali-pagire",
      name: "Dr. Vrushali Pagire",
      source: "crf-instrument-operators-2026-07-27"
    }
  ],
  capabilities: [
    {
      id: "imaging-microanalysis",
      number: "01",
      name: "Imaging & Microanalysis",
      summary: "High-resolution imaging, morphology, elemental microanalysis, and optical examination.",
      clusterIds: ["imaging"]
    },
    {
      id: "structural-optical-characterisation",
      number: "02",
      name: "Structural & Optical Characterisation",
      summary: "Crystallographic, vibrational, absorption, transmission, and reflectance measurements.",
      clusterIds: ["structure", "optical"]
    },
    {
      id: "elemental-particle-analysis",
      number: "03",
      name: "Elemental & Particle Analysis",
      summary: "Trace elemental measurement and particle-size or surface-charge analysis.",
      clusterIds: ["elemental"]
    },
    {
      id: "surface-thin-films-nanofabrication",
      number: "04",
      name: "Surface, Thin Films & Nanofabrication",
      summary: "Surface and nanoscale mechanical measurement with research-scale thin-film deposition.",
      clusterIds: ["surface", "thin-films"]
    },
    {
      id: "energy-storage-cell-fabrication",
      number: "05",
      name: "Energy Storage & Cell Fabrication",
      summary: "Research-scale preparation and assembly of lithium-ion and sodium-ion cells.",
      clusterIds: ["energy"]
    }
  ],
  /* `suppliedAs` is the equipment name the operator spreadsheet used, written
   * out beside the name this site uses. The two differ on three of the eight
   * rows and the difference is not something a builder should guess at: a
   * fuzzy match between "Raman Spectroscopy" and "Raman Spectrometer" is also
   * a fuzzy match between two instruments that happen to share a word. So the
   * mapping is declared here, reviewed once, and checked against the
   * spreadsheet itself by tools/tests/test_facility_capabilities.py, which
   * reads the .xlsx rather than a transcription of it.
   *
   * One row maps to two records: the source's "UV-Vis,UV DRS,UV-NIR" is a
   * single line covering both spectrophotometers, so both carry it. Three
   * records carry no `suppliedAs` — the polarizing microscope, the
   * nanoindenter and the surface profiler are absent from the spreadsheet,
   * and an instrument with no operator in the source gets no operator here.
   */
  clusters: [
    {
      id: "imaging",
      number: "01",
      name: "Imaging & Microanalysis",
      summary: "High-resolution imaging, morphology, elemental microanalysis, and optical examination.",
      instruments: [
        {
          name: "Field-Emission Scanning Electron Microscope with EDS",
          shortName: "FESEM–EDS",
          model: "TESCAN field-emission SEM with EDAX EDS",
          use: "High-resolution surface imaging and local elemental analysis of materials.",
          suppliedAs: "FESEM with EDS",
          operatorIds: ["ranjit-kate"]
        },
        {
          name: "Polarizing Digital Research Microscope",
          shortName: "Polarizing Microscope",
          model: "OPTIKA B-510POL",
          use: "Polarized-light examination of crystalline, mineral, polymer, and anisotropic specimens."
        }
      ]
    },
    {
      id: "structure",
      number: "02",
      name: "Structural & Molecular Characterisation",
      summary: "Phase identification, crystallographic analysis, and vibrational spectroscopy.",
      instruments: [
        {
          name: "X-Ray Diffractometer",
          shortName: "XRD",
          model: "Malvern Panalytical Empyrean Series III",
          use: "Phase identification, crystal-structure analysis, and thin-film or powder measurements.",
          suppliedAs: "X-Ray Diffractometer",
          operatorIds: ["santosh-patil", "aparna-potdar"]
        },
        {
          name: "Raman Spectrometer",
          shortName: "Raman",
          model: "JASCO NRS-4500",
          use: "Non-destructive vibrational and chemical characterisation of materials.",
          suppliedAs: "Raman Spectroscopy",
          operatorIds: ["vrushali-pagire"]
        }
      ]
    },
    {
      id: "elemental",
      number: "03",
      name: "Elemental & Particle Analysis",
      summary: "Trace elemental measurement and particle-size or surface-charge analysis.",
      instruments: [
        {
          name: "Inductively Coupled Plasma Mass Spectrometer",
          shortName: "ICP-MS",
          model: "Shimadzu ICPMS-2040LF",
          use: "Sensitive multi-element and trace-element analysis of prepared samples.",
          suppliedAs: "ICPMS",
          operatorIds: ["santosh-patil"]
        },
        {
          name: "Particle Size & Zeta Potential Analyser",
          shortName: "Zetasizer",
          model: "Malvern Panalytical Zetasizer Advance",
          use: "Particle-size, molecular-size, and zeta-potential measurements in dispersions.",
          suppliedAs: "Particle Size and Zeta Potential",
          operatorIds: ["aparna-potdar"]
        }
      ]
    },
    {
      id: "surface",
      number: "04",
      name: "Surface & Mechanical Characterisation",
      summary: "Nanoscale mechanical response and precision surface-profile measurement.",
      instruments: [
        {
          name: "Nanoindenter",
          shortName: "Nanoindenter",
          model: "Industron NG-80",
          use: "Instrumented indentation for nanoscale hardness and elastic-modulus measurements."
        },
        {
          name: "Stylus Surface Profiler",
          shortName: "Surface Profiler",
          model: "Bruker Dektak Pro",
          use: "Surface topography, film-thickness, step-height, and roughness measurement."
        }
      ]
    },
    {
      id: "thin-films",
      number: "05",
      name: "Thin Films & Nanofabrication",
      summary: "Physical-vapour deposition for functional coatings and research-scale thin films.",
      instruments: [
        {
          name: "Integrated Thin-Film Deposition System",
          shortName: "PVD System",
          model: "E-beam and thermal evaporation with DC/RF sputtering",
          use: "Research-scale deposition of metallic, dielectric, and functional thin films.",
          suppliedAs: "RF-DC Sputtering and Thermal E-Beam System",
          operatorIds: ["santosh-patil"]
        }
      ]
    },
    {
      id: "energy",
      number: "06",
      name: "Energy Storage",
      summary: "Research-scale fabrication of electrochemical cells and battery materials.",
      instruments: [
        {
          name: "Complete Battery Fabrication System",
          shortName: "Battery Fabrication",
          model: "Li-ion and Na-ion cell fabrication facility",
          use: "Controlled preparation and assembly of research-scale battery cells.",
          suppliedAs: "Coin Cell Fabrication",
          operatorIds: ["aparna-potdar", "ranjit-kate"]
        }
      ]
    },
    {
      id: "optical",
      number: "07",
      name: "Optical Spectroscopy",
      summary: "Absorption, transmission, reflectance, and diffuse-reflectance measurements.",
      instruments: [
        {
          name: "UV–Visible Spectrophotometry & Diffuse Reflectance",
          shortName: "UV–Vis / DRS",
          model: "Labindia UV3200 and UV3092",
          use: "UV–visible absorption, transmission, and diffuse-reflectance measurements.",
          suppliedAs: "UV-Vis,UV DRS,UV-NIR",
          operatorIds: ["aparna-potdar"]
        },
        {
          name: "UV–Vis–NIR Spectrophotometer",
          shortName: "UV–Vis–NIR",
          model: "Shimadzu UV-3600i Plus",
          use: "Broadband optical characterisation across ultraviolet, visible, and near-infrared wavelengths.",
          suppliedAs: "UV-Vis,UV DRS,UV-NIR",
          operatorIds: ["aparna-potdar"]
        }
      ]
    }
  ],
  leadership: [
    {
      name: "Dr. Bharat S. Chaudhari",
      role: "Dean, Research & Development",
      source: "https://mitwpu.edu.in/leadership/dr-bharat-s-chaudhari-204"
    },
    {
      name: "Prof. Satishchandra B. Ogale",
      role: "Hon. Distinguished Professor",
      source: "https://mitwpu.edu.in/research"
    },
    {
      name: "Dr. Krishna Warhade",
      role: "Director, Doctoral Programmes",
      source: "https://mitwpu.edu.in/research"
    }
  ],
  facultyContacts: []
};
