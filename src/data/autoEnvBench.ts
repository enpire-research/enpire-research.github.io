// Auto-generated from ENPIRE benchmark YAML data.
export type DataPoint = { elapsed_hours: number; score: number };
export type Run = { name: string; points: DataPoint[] };
export type Method = { name: string; runs: Run[]; best: DataPoint[] };
export type ScalingSeries = { name: string; key: string; points?: DataPoint[]; runs?: Run[]; best?: DataPoint[] };

export const MODEL_COLORS: Record<string, string> = {
  codex: "#6b73ff",
  claude: "#d97759",
  kimi: "#a0a0a0",
};

export const AGENT_COLORS: Record<string, string> = {
  agent1: "#A1DF00",
  agent4: "#82B500",
  agent8: "#486600",
};

export const pushtModelData: Method[] = [
  {
    "name": "codex",
    "runs": [
      {
        "name": "run 1",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 0.5,
            "score": 0.25
          },
          {
            "elapsed_hours": 5.42861111,
            "score": 0.5
          },
          {
            "elapsed_hours": 6.25361111,
            "score": 0.75
          },
          {
            "elapsed_hours": 7.25222222,
            "score": 1
          }
        ]
      },
      {
        "name": "run 2",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 0.16666667,
            "score": 0.25
          },
          {
            "elapsed_hours": 1,
            "score": 0.5
          },
          {
            "elapsed_hours": 1.2,
            "score": 0.75
          },
          {
            "elapsed_hours": 3.11666667,
            "score": 1
          }
        ]
      },
      {
        "name": "run 3",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 0.26666667,
            "score": 0.25
          },
          {
            "elapsed_hours": 0.8,
            "score": 0.5
          },
          {
            "elapsed_hours": 2.8,
            "score": 0.75
          },
          {
            "elapsed_hours": 4.7,
            "score": 1
          }
        ]
      },
      {
        "name": "run 4",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 0.33333333,
            "score": 0.25
          },
          {
            "elapsed_hours": 3.7,
            "score": 0.5
          },
          {
            "elapsed_hours": 7.25,
            "score": 0.75
          }
        ]
      }
    ],
    "best": [
      {
        "elapsed_hours": 0,
        "score": 0
      },
      {
        "elapsed_hours": 0.16666667,
        "score": 0.25
      },
      {
        "elapsed_hours": 0.8,
        "score": 0.5
      },
      {
        "elapsed_hours": 1.2,
        "score": 0.75
      },
      {
        "elapsed_hours": 3.11666667,
        "score": 1
      }
    ]
  },
  {
    "name": "claude code",
    "runs": [
      {
        "name": "run 1",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 0.5,
            "score": 0.25
          },
          {
            "elapsed_hours": 5.2075,
            "score": 0.5
          },
          {
            "elapsed_hours": 5.82638889,
            "score": 0.75
          },
          {
            "elapsed_hours": 22.75583333,
            "score": 0.75
          }
        ]
      },
      {
        "name": "run 2",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 1,
            "score": 0.25
          },
          {
            "elapsed_hours": 5,
            "score": 0.5
          },
          {
            "elapsed_hours": 7,
            "score": 0.75
          },
          {
            "elapsed_hours": 10,
            "score": 0.75
          }
        ]
      },
      {
        "name": "run 3",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 0.48333333,
            "score": 0.25
          },
          {
            "elapsed_hours": 2.16666667,
            "score": 0.5
          },
          {
            "elapsed_hours": 3.5,
            "score": 0.75
          }
        ]
      },
      {
        "name": "run 4",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 0.11666667,
            "score": 0.25
          },
          {
            "elapsed_hours": 3.38333333,
            "score": 0.5
          },
          {
            "elapsed_hours": 4.88333333,
            "score": 0.75
          }
        ]
      }
    ],
    "best": [
      {
        "elapsed_hours": 0,
        "score": 0
      },
      {
        "elapsed_hours": 0.11666667,
        "score": 0.25
      },
      {
        "elapsed_hours": 2.16666667,
        "score": 0.5
      },
      {
        "elapsed_hours": 3.5,
        "score": 0.75
      }
    ]
  },
  {
    "name": "kimi",
    "runs": [
      {
        "name": "run 1",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 0.71666667,
            "score": 0.25
          },
          {
            "elapsed_hours": 1.66666667,
            "score": 0.5
          }
        ]
      },
      {
        "name": "run 2",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 0.16861111,
            "score": 0.25
          },
          {
            "elapsed_hours": 1.18527778,
            "score": 0.5
          },
          {
            "elapsed_hours": 4.36861111,
            "score": 0.75
          },
          {
            "elapsed_hours": 6.05194444,
            "score": 1
          }
        ]
      },
      {
        "name": "run 3",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 3.2,
            "score": 0.25
          }
        ]
      },
      {
        "name": "run 4",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 0.48333333,
            "score": 0.25
          },
          {
            "elapsed_hours": 1.38333333,
            "score": 0.5
          },
          {
            "elapsed_hours": 1.53333333,
            "score": 0.75
          }
        ]
      }
    ],
    "best": [
      {
        "elapsed_hours": 0,
        "score": 0
      },
      {
        "elapsed_hours": 0.16861111,
        "score": 0.25
      },
      {
        "elapsed_hours": 1.18527778,
        "score": 0.5
      },
      {
        "elapsed_hours": 1.53333333,
        "score": 0.75
      },
      {
        "elapsed_hours": 6.05194444,
        "score": 1
      }
    ]
  }
];

export const pushtScalingData: ScalingSeries[] = [
  {
    "name": "1-agent best",
    "key": "agent1",
    "points": [
      {
        "elapsed_hours": 0,
        "score": 0
      },
      {
        "elapsed_hours": 0.26666667,
        "score": 0.25
      },
      {
        "elapsed_hours": 0.8,
        "score": 0.5
      },
      {
        "elapsed_hours": 2.8,
        "score": 0.75
      },
      {
        "elapsed_hours": 4.7,
        "score": 1
      }
    ]
  },
  {
    "name": "4-agent runs",
    "key": "agent4",
    "runs": [
      {
        "name": "run 1",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 0.7,
            "score": 0.25
          },
          {
            "elapsed_hours": 1.06666667,
            "score": 0.5
          },
          {
            "elapsed_hours": 2.06666667,
            "score": 0.75
          },
          {
            "elapsed_hours": 3.65,
            "score": 1
          }
        ]
      },
      {
        "name": "run 2",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 0.6,
            "score": 0.25
          },
          {
            "elapsed_hours": 1.15,
            "score": 0.5
          },
          {
            "elapsed_hours": 3.11666667,
            "score": 1
          }
        ]
      },
      {
        "name": "run 3",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 0.63333333,
            "score": 0.25
          },
          {
            "elapsed_hours": 2.18333333,
            "score": 0.5
          }
        ]
      },
      {
        "name": "run 4",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 0.71666667,
            "score": 0.25
          },
          {
            "elapsed_hours": 2.31666667,
            "score": 0.5
          },
          {
            "elapsed_hours": 5.51666667,
            "score": 1
          }
        ]
      }
    ],
    "best": [
      {
        "elapsed_hours": 0,
        "score": 0
      },
      {
        "elapsed_hours": 0.6,
        "score": 0.25
      },
      {
        "elapsed_hours": 1.06666667,
        "score": 0.5
      },
      {
        "elapsed_hours": 2.06666667,
        "score": 0.75
      },
      {
        "elapsed_hours": 3.11666667,
        "score": 1
      }
    ]
  },
  {
    "name": "8-agent runs",
    "key": "agent8",
    "runs": [
      {
        "name": "run 1",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 1.65,
            "score": 0.5
          },
          {
            "elapsed_hours": 2.25,
            "score": 0.75
          },
          {
            "elapsed_hours": 4.36666667,
            "score": 1
          }
        ]
      },
      {
        "name": "run 2",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 1.38333333,
            "score": 0.5
          },
          {
            "elapsed_hours": 1.95,
            "score": 0.75
          },
          {
            "elapsed_hours": 2.83333333,
            "score": 1
          }
        ]
      },
      {
        "name": "run 3",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 1.46666667,
            "score": 0.25
          },
          {
            "elapsed_hours": 1.6,
            "score": 0.5
          },
          {
            "elapsed_hours": 2.16666667,
            "score": 0.75
          },
          {
            "elapsed_hours": 2.68333333,
            "score": 1
          }
        ]
      },
      {
        "name": "run 4",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 1.61666667,
            "score": 0.5
          },
          {
            "elapsed_hours": 2.61666667,
            "score": 0.75
          }
        ]
      },
      {
        "name": "run 5",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0
          },
          {
            "elapsed_hours": 1.48333333,
            "score": 0.25
          },
          {
            "elapsed_hours": 1.68333333,
            "score": 0.5
          },
          {
            "elapsed_hours": 1.98333333,
            "score": 1
          }
        ]
      }
    ],
    "best": [
      {
        "elapsed_hours": 0,
        "score": 0
      },
      {
        "elapsed_hours": 1.38333333,
        "score": 0.5
      },
      {
        "elapsed_hours": 1.95,
        "score": 0.75
      },
      {
        "elapsed_hours": 1.98333333,
        "score": 1
      }
    ]
  }
];

export const pinModelData: Method[] = [
  {
    "name": "codex",
    "runs": [
      {
        "name": "run 1",
        "points": [
          {
            "elapsed_hours": 0.07111166666666667,
            "score": 0.46
          },
          {
            "elapsed_hours": 0.8433333333333334,
            "score": 0.88
          },
          {
            "elapsed_hours": 2.000278333333333,
            "score": 0.92
          },
          {
            "elapsed_hours": 2.3494450000000002,
            "score": 0.94
          },
          {
            "elapsed_hours": 2.785555,
            "score": 0.98
          }
        ]
      },
      {
        "name": "run 2",
        "points": [
          {
            "elapsed_hours": 0.91,
            "score": 0.4
          },
          {
            "elapsed_hours": 1.1900000000000002,
            "score": 0.625
          },
          {
            "elapsed_hours": 1.41,
            "score": 0.75
          },
          {
            "elapsed_hours": 1.43,
            "score": 0.818
          },
          {
            "elapsed_hours": 3.953333333333333,
            "score": 1
          }
        ]
      },
      {
        "name": "run 3",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0.52
          },
          {
            "elapsed_hours": 1.3,
            "score": 0.5820000000000001
          },
          {
            "elapsed_hours": 2.6,
            "score": 0.789
          },
          {
            "elapsed_hours": 2.966666666666667,
            "score": 0.84
          }
        ]
      },
      {
        "name": "run 4",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0.52
          },
          {
            "elapsed_hours": 0.9,
            "score": 0.68
          },
          {
            "elapsed_hours": 1.1,
            "score": 0.86
          },
          {
            "elapsed_hours": 1.3333333333333333,
            "score": 0.94
          },
          {
            "elapsed_hours": 1.7666666666666666,
            "score": 0.98
          },
          {
            "elapsed_hours": 3.6666666666666665,
            "score": 1
          }
        ]
      }
    ],
    "best": [
      {
        "elapsed_hours": 0,
        "score": 0.52
      },
      {
        "elapsed_hours": 0.8433333333333334,
        "score": 0.88
      },
      {
        "elapsed_hours": 1.3333333333333333,
        "score": 0.94
      },
      {
        "elapsed_hours": 1.7666666666666666,
        "score": 0.98
      },
      {
        "elapsed_hours": 3.6666666666666665,
        "score": 1
      }
    ]
  },
  {
    "name": "claude",
    "runs": [
      {
        "name": "run 1",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0.6
          },
          {
            "elapsed_hours": 1.0011116666666666,
            "score": 0.86
          },
          {
            "elapsed_hours": 2.146945,
            "score": 0.88
          },
          {
            "elapsed_hours": 3.4988883333333334,
            "score": 0.98
          }
        ]
      },
      {
        "name": "run 2",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0.52
          },
          {
            "elapsed_hours": 1.9513883333333333,
            "score": 0.78
          },
          {
            "elapsed_hours": 2.4011116666666665,
            "score": 0.82
          },
          {
            "elapsed_hours": 3.0711116666666665,
            "score": 0.98
          },
          {
            "elapsed_hours": 3.565833333333333,
            "score": 1
          }
        ]
      },
      {
        "name": "run 3",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0.58
          },
          {
            "elapsed_hours": 1.6511116666666665,
            "score": 0.8
          },
          {
            "elapsed_hours": 2.0594449999999997,
            "score": 0.84
          },
          {
            "elapsed_hours": 2.7336116666666666,
            "score": 0.88
          },
          {
            "elapsed_hours": 3.0974999999999997,
            "score": 0.92
          }
        ]
      },
      {
        "name": "run 4",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0.56
          },
          {
            "elapsed_hours": 0.4097216666666667,
            "score": 0.86
          },
          {
            "elapsed_hours": 0.8008333333333333,
            "score": 0.94
          },
          {
            "elapsed_hours": 1.6066666666666667,
            "score": 0.96
          },
          {
            "elapsed_hours": 1.9997216666666666,
            "score": 1
          }
        ]
      }
    ],
    "best": [
      {
        "elapsed_hours": 0,
        "score": 0.6
      },
      {
        "elapsed_hours": 0.4097216666666667,
        "score": 0.86
      },
      {
        "elapsed_hours": 0.8008333333333333,
        "score": 0.94
      },
      {
        "elapsed_hours": 1.6066666666666667,
        "score": 0.96
      },
      {
        "elapsed_hours": 1.9997216666666666,
        "score": 1
      }
    ]
  },
  {
    "name": "kimi",
    "runs": [
      {
        "name": "run 1",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0.51
          },
          {
            "elapsed_hours": 0.20972166666666667,
            "score": 0.62
          },
          {
            "elapsed_hours": 1.341945,
            "score": 0.86
          },
          {
            "elapsed_hours": 2.593888333333333,
            "score": 0.9
          }
        ]
      },
      {
        "name": "run 2",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0.41200000000000003
          },
          {
            "elapsed_hours": 2.216666666666667,
            "score": 0.78
          }
        ]
      },
      {
        "name": "run 3",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0.44
          },
          {
            "elapsed_hours": 3.066666666666667,
            "score": 0.82
          }
        ]
      },
      {
        "name": "run 4",
        "points": [
          {
            "elapsed_hours": 0,
            "score": 0.6
          },
          {
            "elapsed_hours": 2.4113883333333335,
            "score": 0.66
          }
        ]
      }
    ],
    "best": [
      {
        "elapsed_hours": 0,
        "score": 0.6
      },
      {
        "elapsed_hours": 0.20972166666666667,
        "score": 0.62
      },
      {
        "elapsed_hours": 1.341945,
        "score": 0.86
      },
      {
        "elapsed_hours": 2.593888333333333,
        "score": 0.9
      }
    ]
  }
];

export const pinScalingData: ScalingSeries[] = [
  {
    "name": "1-agent best",
    "key": "agent1",
    "points": [
      {
        "elapsed_hours": 0,
        "score": 0
      },
      {
        "elapsed_hours": 0.5,
        "score": 0.56
      },
      {
        "elapsed_hours": 0.9097216666666667,
        "score": 0.86
      },
      {
        "elapsed_hours": 1.3008333333333333,
        "score": 0.94
      },
      {
        "elapsed_hours": 2.106666666666667,
        "score": 0.96
      },
      {
        "elapsed_hours": 2.2666666666666666,
        "score": 0.98
      },
      {
        "elapsed_hours": 2.4997216666666664,
        "score": 1
      }
    ]
  },
  {
    "name": "4-agent runs",
    "key": "agent4",
    "runs": [
      {
        "name": "run 1",
        "points": [
          {
            "elapsed_hours": 0.2866666666666667,
            "score": 0
          },
          {
            "elapsed_hours": 0.8916666666666667,
            "score": 1
          }
        ]
      },
      {
        "name": "run 2",
        "points": [
          {
            "elapsed_hours": 0.33,
            "score": 0.76
          },
          {
            "elapsed_hours": 1.9683333333333333,
            "score": 0.94
          },
          {
            "elapsed_hours": 2.0983333333333336,
            "score": 1
          }
        ]
      },
      {
        "name": "run 3",
        "points": [
          {
            "elapsed_hours": 0.5933333333333334,
            "score": 0.93
          },
          {
            "elapsed_hours": 1.2583333333333333,
            "score": 1
          }
        ]
      },
      {
        "name": "run 4",
        "points": [
          {
            "elapsed_hours": 0.8066666666666666,
            "score": 0.86
          },
          {
            "elapsed_hours": 1.0066666666666666,
            "score": 0.92
          },
          {
            "elapsed_hours": 1.6,
            "score": 0.9
          },
          {
            "elapsed_hours": 2.1483333333333334,
            "score": 0.86
          }
        ]
      }
    ],
    "best": [
      {
        "elapsed_hours": 0,
        "score": 0
      },
      {
        "elapsed_hours": 0.33,
        "score": 0.76
      },
      {
        "elapsed_hours": 0.5933333333333334,
        "score": 0.93
      },
      {
        "elapsed_hours": 0.8916666666666667,
        "score": 1
      }
    ]
  },
  {
    "name": "8-agent runs",
    "key": "agent8",
    "runs": [
      {
        "name": "run 1",
        "points": [
          {
            "elapsed_hours": 0.31666666666666665,
            "score": 0
          },
          {
            "elapsed_hours": 2.6,
            "score": 0.588
          },
          {
            "elapsed_hours": 2.8666666666666667,
            "score": 0.64
          },
          {
            "elapsed_hours": 3.15,
            "score": 0.75
          },
          {
            "elapsed_hours": 3.283333333333333,
            "score": 0.821
          }
        ]
      },
      {
        "name": "run 2",
        "points": [
          {
            "elapsed_hours": 0.1,
            "score": 0
          },
          {
            "elapsed_hours": 0.5833333333333334,
            "score": 0.135
          },
          {
            "elapsed_hours": 0.8166666666666667,
            "score": 1
          }
        ]
      },
      {
        "name": "run 3",
        "points": [
          {
            "elapsed_hours": 0.15,
            "score": 0.353
          },
          {
            "elapsed_hours": 1.4833333333333334,
            "score": 0.8
          },
          {
            "elapsed_hours": 2.1666666666666665,
            "score": 0.882
          },
          {
            "elapsed_hours": 2.5166666666666666,
            "score": 0.986
          }
        ]
      },
      {
        "name": "run 4",
        "points": [
          {
            "elapsed_hours": 0.36666666666666664,
            "score": 0.105
          },
          {
            "elapsed_hours": 0.6666666666666666,
            "score": 0.16699999999999998
          },
          {
            "elapsed_hours": 1.0833333333333333,
            "score": 0.36700000000000005
          },
          {
            "elapsed_hours": 1.2166666666666666,
            "score": 0.812
          },
          {
            "elapsed_hours": 1.3666666666666667,
            "score": 0.875
          },
          {
            "elapsed_hours": 1.6166666666666667,
            "score": 0.909
          },
          {
            "elapsed_hours": 1.9833333333333334,
            "score": 0.9840000000000001
          }
        ]
      },
      {
        "name": "gear-0158",
        "points": [
          {
            "elapsed_hours": 0.25,
            "score": 0
          },
          {
            "elapsed_hours": 0.31666666666666665,
            "score": 0.053
          },
          {
            "elapsed_hours": 0.5,
            "score": 0.977
          },
          {
            "elapsed_hours": 0.6666666666666666,
            "score": 1
          }
        ]
      },
      {
        "name": "gear-0208",
        "points": [
          {
            "elapsed_hours": 0.26666666666666666,
            "score": 0
          },
          {
            "elapsed_hours": 0.4166666666666667,
            "score": 0.33299999999999996
          },
          {
            "elapsed_hours": 0.55,
            "score": 0.5
          },
          {
            "elapsed_hours": 0.8,
            "score": 0.8420000000000001
          },
          {
            "elapsed_hours": 0.95,
            "score": 0.889
          },
          {
            "elapsed_hours": 1.0666666666666667,
            "score": 1
          }
        ]
      },
      {
        "name": "yam-auto-4",
        "points": [
          {
            "elapsed_hours": 0.35,
            "score": 0
          },
          {
            "elapsed_hours": 0.9,
            "score": 1
          }
        ]
      }
    ],
    "best": [
      {
        "elapsed_hours": 0,
        "score": 0
      },
      {
        "elapsed_hours": 0.15,
        "score": 0.353
      },
      {
        "elapsed_hours": 0.5,
        "score": 0.977
      },
      {
        "elapsed_hours": 0.6666666666666666,
        "score": 1
      }
    ]
  }
];
