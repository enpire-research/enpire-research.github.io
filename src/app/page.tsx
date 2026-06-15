"use client";

import { List, Maximize2, Moon, Pause, Play, RotateCcw, Sun, X } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import AutoEnvBenchChart, { AutoEnvBenchScalingChart } from "@/components/AutoEnvBenchChart";
import ExpandableVideoViewer from "@/components/ExpandableVideoViewer";
import EnpireFigureOne from "@/components/EnpireFigureOne";
import IdeaTreeNative from "@/components/IdeaTreeNative";
import { AgentResourceUtilization } from "@/components/AgentResourceUtilization";
import PushTStageProgress from "@/components/PushTStageProgress";
import PushTPolicyPanel from "@/components/PushTPolicyPanel";
import PushTResetCasePanel from "@/components/PushTResetCasePanel";
import { ResetVideoCasePanel } from "@/components/ResetVideoCasePanel";
import { ZiptieRewardPanel } from "@/components/ZiptieRewardPanel";
import PasscodeGate from "@/components/PasscodeGate";
import { ziptieResetCode, ziptieResetCodeFile } from "@/data/ziptieResetCode";
import { gpuResetCode, gpuResetCodeFile } from "@/data/gpuResetCode";

type ArticleBlock =
  | { type: "heading"; text: string }
  | { type: "subsection"; text: string }
  | { type: "subhead"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "image"; src: string; caption?: string; height?: number; transparent?: boolean; wide?: boolean; width?: number }
  | { type: "video"; src: string; caption?: string; paired?: string }
  | { type: "pusht-policy" }
  | { type: "pusht-reset-case" }
  | { type: "pin-reset-case" }
  | { type: "ziptie-reset-case" }
  | { type: "ziptie-reward" }
  | { type: "gpu-reset-case" }
  | { type: "reset-placeholder"; title: string }
  | { type: "claim-grid" }
  | { type: "learned-policy-panels" }
  | { type: "idea-tree-embed" }
  | { type: "system-intro"; text: string }
  | { type: "system-diagram" }
  | { type: "autoenv-chart" }
  | { type: "autoenv-scaling-chart" }
  | { type: "simulation-gallery-placeholder" }
  | { type: "fleet-video" }
  | { type: "pusht-stage-progress" }
  | { type: "agent-resource-utilization" };

function isFigureBlock(block: ArticleBlock) {
  if (block.type === "image" || block.type === "video") {
    return Boolean(block.caption);
  }

  return (
    block.type === "autoenv-chart" ||
    block.type === "autoenv-scaling-chart" ||
    block.type === "system-diagram" ||
    block.type === "idea-tree-embed" ||
    block.type === "pusht-stage-progress" ||
    block.type === "agent-resource-utilization"
  );
}

const videos = {
  fleetScroll: "/videos/fleet-scroll.mp4",
  previousTeaser: "/videos/drone-shot-test-01-from15.mp4",
};

type ThemeMode = "night" | "day";

const themeStorageKey = "enpire-theme";

const outlineItems = [
  { href: "#article-title", label: "Title" },
  { href: "#abstract", label: "Abstract" },
  { href: "#learned-manipulation-policy", label: "Learned Policy" },
  { href: "#enpire-system", label: "ENPIRE System" },
  { href: "#environment-loop", label: "Environment Loop" },
  { href: "#auto-evaluation", label: "Auto Evaluation", level: 2 },
  { href: "#auto-reset", label: "Auto Reset", level: 2 },
  { href: "#case-pusht", label: "Case 1: Push T", level: 3 },
  { href: "#case-pin-insertion", label: "Case 2: Pin Insertion", level: 3 },
  { href: "#case-tie-ziptie", label: "Case 3: Tie Zip-tie", level: 3 },
  { href: "#case-gpu-insertion", label: "Case 4: GPU Insertion", level: 3 },
  { href: "#policy-improvement", label: "Policy Improvement" },
  { href: "#autoenvbench", label: "Evaluate Coding Agent" },
  { href: "#fleet-scaling", label: "Fleet Scaling" },
  { href: "#simulation-evaluation", label: "Simulation Evaluation" },
  { href: "#limitations", label: "Limitations & Future Directions" },
  { href: "#acknowledgements", label: "Acknowledgements" },
];

const headingIds: Record<string, string> = {
  Abstract: "abstract",
  "Learned Manipulation Policy": "learned-manipulation-policy",
  "ENPIRE System": "enpire-system",
  "From Robot Hardware to an Agent-Operable Environment": "environment-loop",
  "Agents Improve Policies From Physical Feedback": "policy-improvement",
  "Evaluate Coding Agent": "autoenvbench",
  "Scaling Autoresearch on Robot Fleets": "fleet-scaling",
  "Evaluation in Simulation": "simulation-evaluation",
  "Limitations & Future Directions": "limitations",
  Acknowledgements: "acknowledgements",
};

const subsectionIds: Record<string, string> = {
  "Auto Evaluation": "auto-evaluation",
  "Auto Reset": "auto-reset",
};

const subheadIds: Record<string, string> = {
  "Case 1: Push T": "case-pusht",
  "Case 2: Pin Insertion": "case-pin-insertion",
  "Case 3: Tie Zip-tie": "case-tie-ziptie",
  "Case 4: GPU Insertion": "case-gpu-insertion",
};

const titleAuthors = [
  { name: "Wenli Xiao", marks: "1,2†", href: "https://wenlixiao.com/" },
  { name: "Jia Xie", marks: "2†", href: "https://github.com/jia-xie" },
  { name: "Tonghe Zhang", marks: "2†", href: "https://tonghe-zhang.github.io/" },
  { name: "Haotian Lin", marks: "2†", href: "https://darthutopian.github.io/" },
  { name: "Letian \"Max\" Fu", marks: "3", href: "https://max-fu.github.io/" },
  { name: "Haorux Xue", marks: "3", href: "https://haoruxue.github.io/" },
  { name: "Jalen Lu", marks: "2" },
  { name: "Yi Yang", marks: "2", breakBefore: true },
  { name: "Cunxi Dai", marks: "2", href: "https://cunxid.github.io/" },
  { name: "Zi Wang", marks: "1", href: "https://ziwang1105.github.io/" },
  { name: "Jimmy Wu", marks: "1", href: "https://jimmyyhwu.github.io/" },
  { name: "Guanzhi Wang", marks: "1", href: "https://guanzhi.me/" },
  { name: "S. Shankar Sastry", marks: "3", href: "https://www2.eecs.berkeley.edu/Faculty/Homepages/sastry.html" },
  { name: "Ken Goldberg", marks: "3", href: "https://goldberg.berkeley.edu/" },
  { name: "Linxi \"Jim\" Fan", marks: "1‡", breakBefore: true, href: "https://jimfan.me/" },
  { name: "Yuke Zhu", marks: "1‡", href: "https://yukezhu.me/" },
  { name: "Guanya Shi", marks: "2‡", href: "https://www.gshi.me/" },
];

const titleAffiliations = [
  { mark: "1", label: "NVIDIA" },
  { mark: "2", label: "CMU" },
  { mark: "3", label: "UC Berkeley" },
  { mark: "†", label: "Equal contribution" },
  { mark: "‡", label: "Equal advising" },
];

const titleLogos = [
  { alt: "NVIDIA", src: "/images/logos/nvidia-logo.png", width: 2756, height: 540 },
  { alt: "Carnegie Mellon University", src: "/images/logos/cmu-logo.png", width: 3814, height: 360 },
  { alt: "UC Berkeley", src: "/images/logos/uc-berkeley-logo.png", width: 1064, height: 214 },
];

const article: ArticleBlock[] = [
  { type: "heading", text: "Abstract" },
  {
    type: "paragraph",
    text: "Achieving dexterous robotic manipulation in the real world relies heavily on human supervision and algorithmic engineering, which is a central bottleneck in the pursuit of general physical intelligence. Although emerging coding agents can generate code to automate algorithm search, their successes remain largely confined to digital environments. We conjecture that the missing abstraction to automate robotics research is a repeatable feedback loop for real-world policy improvement: reset the scene, execute a policy, verify the outcome, and refine the next iteration.",
  },
  {
    type: "paragraph",
    text: "To bridge this gap, we introduce ENPIRE, a harness framework for coding agents that instantiates this physical feedback routine with four core modules: an Environment module (EN) for automatic reset and verification, a Policy Improvement module (PI) that launches policy refinement, a Rollout module (R) to evaluate policies with single or multiple physical robots operating in parallel, and an Evolution module (E) in which coding agents analyze logs, consult literature, improve training infrastructure and algorithm code to address failure modes.",
  },
  {
    type: "paragraph",
    text: "This closed-loop system transforms real-world robot learning into a controllable optimization procedure that agents can manage, thus minimizing human effort while allowing fair ablations across training recipes and agent variants. Powered by ENPIRE, frontier coding agents can autonomously develop a policy to achieve a 99% success rate on challenging, dexterous manipulation tasks in the real world, such as PushT, organizing pins into a pin box, and using a cutter to cut a zip tie.",
  },
  {
    type: "paragraph",
    text: "Coding agents can improve policies with various PI regimes, such as heuristic learning, tool calling, behavior cloning, offline or online RL. Moreover, ENPIRE can be significantly accelerated on a robot fleet, and we propose two metrics, namely, Mean Robot Utilization (MRU) and Mean Token Utilization (MTU) to measure the efficiency of multiagent physical autoresearch. We also include simulation results in RoboCasa. Our findings suggest a practical and scalable path toward autonomously advancing robotics in the real world. Code will be released.",
  },
  { type: "heading", text: "Learned Manipulation Policy" },
  { type: "learned-policy-panels" },
  { type: "idea-tree-embed" },
  { type: "heading", text: "ENPIRE System" },
  {
    type: "system-intro",
    text: "The website is organized around the same loop used by the agents: construct an environment, improve a policy, roll it out, and use the result to evolve the next research attempt. Each stage is visible as a native page component rather than a static screenshot.",
  },
  { type: "system-diagram" },
  {
    type: "heading",
    text: "From Robot Hardware to an Agent-Operable Environment",
  },
  {
    type: "paragraph",
    text: "Before an agent can improve a robot policy, the task must become self-resetting and self-verifying. Two capabilities make this possible: automatic evaluation, which scores the outcome of each trial without human judgment, and automatic reset, which returns the scene to a fresh initial state for the next trial.",
  },
  { type: "subsection", text: "Auto Evaluation" },
  {
    type: "paragraph",
    text: "We use an autoresearch-derived reward function to automatically score the outcome of zip-tie insertion: a detector draws bounding boxes around the zip-tie head and strap, a segmentation model resolves the same parts into masks over the raw view, and each camera view independently judges whether the zip-tie strap passes through the head above a fixed length threshold. The per-camera verdicts are then fused into the final binary reward.",
  },
  { type: "ziptie-reward" },
  { type: "subsection", text: "Auto Reset" },
  {
    type: "paragraph",
    text: "The reset panels below show the physical loop that makes repeated experiments possible: select a randomized initial state, run the reset behavior, and verify that the trial is ready for the next policy.",
  },
  { type: "subhead", text: "Case 1: Push T" },
  { type: "pusht-reset-case" },
  { type: "subhead", text: "Case 2: Pin Insertion" },
  { type: "pin-reset-case" },
  { type: "subhead", text: "Case 3: Tie Zip-tie" },
  { type: "ziptie-reset-case" },
  { type: "subhead", text: "Case 4: GPU Insertion" },
  { type: "gpu-reset-case" },
  {
    type: "list",
    items: [
      "Automatic reset returns each task to a known randomized initial state without manual intervention.",
      "Automatic verification records whether the reset succeeded and exposes representative frames for inspection.",
      "A shared panel layout lets Push-T, Pin Insertion, Tie Zip-tie, and GPU Insertion use the same evaluation vocabulary.",
    ],
  },
  { type: "heading", text: "Agents Improve Policies From Physical Feedback" },
  {
    type: "paragraph",
    text: "Once the environment is operable, agents edit policy code, run trials, inspect failures, and decide what to change next. The Push-T panel visualizes actual rollout traces from multiple code agents under the same six initial states so the behavior is inspectable, not just summarized by a success rate.",
  },
  { type: "pusht-policy" },
  { type: "heading", text: "Evaluate Coding Agent" },
  {
    type: "paragraph",
    text: "We evaluate the physical autoresearch capability of three coding agents: Codex with GPT-5.5, Claude Code with Opus 4.7, and Kimi Code with Kimi K2.6. Instead of asking only whether a final policy succeeds, AutoEnvBench tracks agent-driven research progress over wall-clock time across Push-T and Pin Insertion.",
  },
  { type: "autoenv-chart" },
  { type: "heading", text: "Scaling Autoresearch on Robot Fleets" },
  {
    type: "paragraph",
    text: "Scaling the number of agents changes both research progress and hardware pressure. The scaling-law plots compare one-, four-, and eight-agent teams on Push-T and Pin Insertion, while the resource utilization figure shows robot utilization, GPU utilization, token throughput, and the time required to reach task success.",
  },
  { type: "autoenv-scaling-chart" },
  { type: "fleet-video" },
  { type: "pusht-stage-progress" },
  { type: "agent-resource-utilization" },
  { type: "heading", text: "Evaluation in Simulation" },
  {
    type: "paragraph",
    text: "We also evaluate ENPIRE in simulation to separate agent-driven research behavior from real-world hardware throughput. Simulation tasks let agents run denser ablations, compare policy-improvement regimes under controlled resets, and test whether recipes discovered in the physical loop transfer to broader manipulation settings.",
  },
  { type: "simulation-gallery-placeholder" },
  { type: "heading", text: "Limitations & Future Directions" },
  { type: "subhead", text: "Robot and compute resources are underutilized" },
  {
    type: "paragraph",
    text: "Coding agents do not fully utilize robot resources when they are reading logs, writing code, debugging, or waiting for the language-model backbone. As the number of robots scales, MRU decreases while GPU active utilization increases. Compared to a single-robot setup, agent teams spend more time summarizing peer branches and less time operating the robot, and coding agents may fail to launch enough parallel training sessions to exhaust GPU resources.",
  },
  { type: "subhead", text: "Scaling robot fleet causes higher token consumption" },
  {
    type: "paragraph",
    text: "Scaling the robot fleet drives higher token consumption: as more agents read logs, summarize peer branches, and coordinate, the total token budget required to reach a successful policy grows with fleet size. Larger fleets can reach success sooner, but the additional speedup comes at the cost of higher token consumption.",
  },
  { type: "heading", text: "Acknowledgements" },
  {
    type: "paragraph",
    text: "We are grateful to many colleagues whose help made this project possible. We thank Jason Liu, Tony Tao, Tairan He, Alex Lin, Jim Yang, Paul Zhou, and Abhi Maddukuri for insightful discussions and feedback; Yide Shentu, Bike Zhang, Angchen Xie, Dvij Kalaria, and Yuqi Xie for their support with the experiments; Lion Park, Matin Furutan, Jeremy Chimienti, Dannis Da, and Tri Cao for fleet operation; and Tri Cao for the demo shots. We also thank the NVIDIA GEAR Team and the CMU LeCAR Lab for their continuous support.",
  },
];

function MediaBlock({ block, figureNumber }: { block: Extract<ArticleBlock, { type: "video" | "image" }>; figureNumber?: number }) {
  const caption = block.caption && figureNumber ? `Figure ${figureNumber}: ${block.caption}` : block.caption;

  if (block.type === "image") {
    const className = [
      "media-frame",
      block.wide ? "media-frame--wide" : "",
      block.transparent ? "media-frame--transparent" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <figure className={className}>
        <Image
          alt=""
          height={block.height ?? 720}
          src={block.src}
          style={block.transparent ? { background: "transparent" } : undefined}
          width={block.width ?? 1280}
        />
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    );
  }

  return (
    <figure className="media-frame">
      {block.paired ? (
        <div className="quad-media">
          <video autoPlay loop muted playsInline src={block.src} />
          <video autoPlay loop muted playsInline src={block.paired} />
        </div>
      ) : (
        <video controls muted playsInline preload="metadata" src={block.src} />
      )}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

function FigureOneNative({ figureNumber }: { figureNumber: number }) {
  return (
    <figure className="figure-one-embed" id="figure-one-native">
      <EnpireFigureOne />
      <figcaption>
        Figure {figureNumber}: ENPIRE system overview, integrated as a native site component with shared typography
        and animation.
      </figcaption>
    </figure>
  );
}

function ResetPlaceholderPanel({ title }: { title: string }) {
  return (
    <section className="reset-placeholder-panel" aria-label={`${title} auto reset placeholder`}>
      <div className="reset-placeholder-panel__media">
        <span>{title}</span>
        <small>2x</small>
      </div>
      <div className="reset-placeholder-panel__rail">
        <span />
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

const robocasaTasks = [
  {
    id: "coffee-setup-mug",
    label: "Coffee Setup Mug",
    cameraLabel: "right camera",
    seeds: [
      {
        label: "Seed 1",
        poster: "/images/robocasa/coffee-setup-mug-seed-1-right.jpg",
        video: "/videos/robocasa/coffee-setup-mug-seed-1-right.mp4",
      },
      {
        label: "Seed 2",
        poster: "/images/robocasa/coffee-setup-mug-seed-2-right.jpg",
        video: "/videos/robocasa/coffee-setup-mug-seed-2-right.mp4",
      },
    ],
  },
  {
    id: "open-cabinet",
    label: "Open Cabinet",
    cameraLabel: "top camera",
    seeds: [
      {
        label: "Seed 1",
        poster: "/images/robocasa/open-cabinet-seed-1.jpg",
        video: "/videos/robocasa/open-cabinet-seed-1.mp4",
      },
      {
        label: "Seed 2",
        poster: "/images/robocasa/open-cabinet-seed-2.jpg",
        video: "/videos/robocasa/open-cabinet-seed-2.mp4",
      },
    ],
  },
  {
    id: "open-drawer",
    label: "Open Drawer",
    cameraLabel: "top camera",
    seeds: [
      {
        label: "Seed 1",
        poster: "/images/robocasa/open-drawer-seed-1.jpg",
        video: "/videos/robocasa/open-drawer-seed-1.mp4",
      },
      {
        label: "Seed 2",
        poster: "/images/robocasa/open-drawer-seed-2.jpg",
        video: "/videos/robocasa/open-drawer-seed-2.mp4",
      },
    ],
  },
  {
    id: "open-stand-mixer-head",
    label: "Open Stand Mixer",
    cameraLabel: "top camera",
    seeds: [
      {
        label: "Seed 1",
        poster: "/images/robocasa/open-stand-mixer-head-seed-1.jpg",
        video: "/videos/robocasa/open-stand-mixer-head-seed-1.mp4",
      },
      {
        label: "Seed 2",
        poster: "/images/robocasa/open-stand-mixer-head-seed-2.jpg",
        video: "/videos/robocasa/open-stand-mixer-head-seed-2.mp4",
      },
    ],
  },
  {
    id: "pick-place-counter-to-cabinet",
    label: "Counter to Cabinet",
    cameraLabel: "top camera",
    seeds: [
      {
        label: "Seed 1",
        poster: "/images/robocasa/pick-place-counter-to-cabinet-seed-1.jpg",
        video: "/videos/robocasa/pick-place-counter-to-cabinet-seed-1.mp4",
      },
      {
        label: "Seed 2",
        poster: "/images/robocasa/pick-place-counter-to-cabinet-seed-2.jpg",
        video: "/videos/robocasa/pick-place-counter-to-cabinet-seed-2.mp4",
      },
    ],
  },
  {
    id: "pick-place-sink-to-counter",
    label: "Sink to Counter",
    cameraLabel: "top camera",
    seeds: [
      {
        label: "Seed 1",
        poster: "/images/robocasa/pick-place-sink-to-counter-seed-1.jpg",
        video: "/videos/robocasa/pick-place-sink-to-counter-seed-1.mp4",
      },
      {
        label: "Seed 2",
        poster: "/images/robocasa/pick-place-sink-to-counter-seed-2.jpg",
        video: "/videos/robocasa/pick-place-sink-to-counter-seed-2.mp4",
      },
    ],
  },
  {
    id: "turn-off-stove",
    label: "Turn Off Stove",
    cameraLabel: "top camera",
    seeds: [
      {
        label: "Seed 1",
        poster: "/images/robocasa/turn-off-stove-seed-1.jpg",
        video: "/videos/robocasa/turn-off-stove-seed-1.mp4",
      },
      {
        label: "Seed 2",
        poster: "/images/robocasa/turn-off-stove-seed-2.jpg",
        video: "/videos/robocasa/turn-off-stove-seed-2.mp4",
      },
    ],
  },
  {
    id: "turn-on-sink-faucet",
    label: "Turn On Sink",
    cameraLabel: "top camera",
    seeds: [
      {
        label: "Seed 1",
        poster: "/images/robocasa/turn-on-sink-faucet-seed-1.jpg",
        video: "/videos/robocasa/turn-on-sink-faucet-seed-1.mp4",
      },
      {
        label: "Seed 2",
        poster: "/images/robocasa/turn-on-sink-faucet-seed-2.jpg",
        video: "/videos/robocasa/turn-on-sink-faucet-seed-2.mp4",
      },
    ],
  },
] as const;

const robocasaSpeeds = [8, 1, 2, 4] as const;

function SimulationGalleryPlaceholder() {
  const [activeTaskId, setActiveTaskId] = useState<(typeof robocasaTasks)[number]["id"]>(robocasaTasks[0].id);
  const [playingByIndex, setPlayingByIndex] = useState<boolean[]>(() => robocasaTasks[0].seeds.map(() => true));
  const [progressByIndex, setProgressByIndex] = useState<number[]>(() => robocasaTasks[0].seeds.map(() => 0));
  const [speedIndexByIndex, setSpeedIndexByIndex] = useState<number[]>(() => robocasaTasks[0].seeds.map(() => 0));
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const activeTask = robocasaTasks.find((task) => task.id === activeTaskId) ?? robocasaTasks[0];

  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (!video) {
        return;
      }
      video.currentTime = 0;
      video.playbackRate = robocasaSpeeds[0];
      video.play().catch(() => undefined);
    });
  }, [activeTaskId]);

  const handleSelectTask = (taskId: (typeof robocasaTasks)[number]["id"]) => {
    if (taskId === activeTaskId) {
      return;
    }
    const nextTask = robocasaTasks.find((task) => task.id === taskId) ?? robocasaTasks[0];
    setProgressByIndex(nextTask.seeds.map(() => 0));
    setPlayingByIndex(nextTask.seeds.map(() => true));
    setSpeedIndexByIndex(nextTask.seeds.map(() => 0));
    setActiveTaskId(taskId);
  };

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) {
        return;
      }
      const shouldPlay = playingByIndex[index] ?? true;
      video.playbackRate = robocasaSpeeds[speedIndexByIndex[index] ?? 0];
      if (shouldPlay) {
        video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    });
  }, [playingByIndex, speedIndexByIndex]);

  const handleTogglePlayback = (index: number) => {
    setPlayingByIndex((current) => current.map((isPlaying, itemIndex) => (itemIndex === index ? !isPlaying : isPlaying)));
  };

  const handleCycleSpeed = (index: number) => {
    setSpeedIndexByIndex((current) =>
      current.map((speedIndex, itemIndex) =>
        itemIndex === index ? (speedIndex + 1) % robocasaSpeeds.length : speedIndex,
      ),
    );
  };

  const handleScrub = (index: number, nextProgress: number) => {
    const clampedProgress = Math.min(1, Math.max(0, nextProgress));
    setProgressByIndex((current) => current.map((progress, itemIndex) => (itemIndex === index ? clampedProgress : progress)));
    const video = videoRefs.current[index];
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
      return;
    }
    video.currentTime = clampedProgress * video.duration;
    video.playbackRate = robocasaSpeeds[speedIndexByIndex[index] ?? 0];
  };

  const handleTimeUpdate = (index: number) => {
    const video = videoRefs.current[index];
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
      return;
    }
    const nextProgress = video.currentTime / video.duration;
    setProgressByIndex((current) => current.map((progress, itemIndex) => (itemIndex === index ? nextProgress : progress)));
  };

  const handleVideoReady = (video: HTMLVideoElement, index: number) => {
    video.playbackRate = robocasaSpeeds[speedIndexByIndex[index] ?? 0];
    if (playingByIndex[index] ?? true) {
      video.play().catch(() => undefined);
    }
  };

  return (
    <section className="robocasa-gallery" aria-label="RoboCasa camera task gallery">
      <div className="robocasa-gallery__tasks" aria-label="RoboCasa tasks">
        {robocasaTasks.map((task) => (
          <button
            aria-pressed={task.id === activeTask.id}
            data-selected={task.id === activeTask.id}
            key={task.id}
            onClick={() => handleSelectTask(task.id)}
            type="button"
          >
            {task.label}
          </button>
        ))}
      </div>
      <div className="robocasa-gallery__videos" aria-label={`${activeTask.label} ${activeTask.cameraLabel} rollouts`}>
        {activeTask.seeds.map((seed, index) => {
          const speed = robocasaSpeeds[speedIndexByIndex[index] ?? 0];

          return (
            <article className="robocasa-gallery__video" key={seed.video}>
              <video
                autoPlay
                loop
                muted
                onLoadedMetadata={(event) => handleVideoReady(event.currentTarget, index)}
                onTimeUpdate={() => handleTimeUpdate(index)}
                playsInline
                poster={seed.poster}
                preload="metadata"
                ref={(element) => {
                  videoRefs.current[index] = element;
                }}
                src={seed.video}
              />
              <button
                aria-label={`${activeTask.label} ${seed.label} playback speed ${speed}x. Click to change speed.`}
                className="robocasa-gallery__speed"
                onClick={() => handleCycleSpeed(index)}
                type="button"
              >
                {speed}x
              </button>
              <div className="robocasa-gallery__meta">
                <strong>{activeTask.label}</strong>
                <span>{seed.label} · {activeTask.cameraLabel}</span>
              </div>
              <div className="robocasa-gallery__controls" aria-label={`${activeTask.label} ${seed.label} video controls`}>
                <button
                  aria-label={playingByIndex[index] ? `Pause ${seed.label}` : `Play ${seed.label}`}
                  className="robocasa-gallery__play"
                  onClick={() => handleTogglePlayback(index)}
                  type="button"
                >
                  {playingByIndex[index] ? <Pause aria-hidden="true" size={15} /> : <Play aria-hidden="true" size={15} />}
                </button>
                <label
                  className="robocasa-gallery__progress"
                  style={{ "--robocasa-progress": `${(progressByIndex[index] ?? 0) * 100}%` } as CSSProperties}
                >
                  <span className="sr-only">{`${seed.label} rollout progress`}</span>
                  <input
                    aria-label={`${seed.label} rollout progress`}
                    max="1"
                    min="0"
                    onChange={(event) => handleScrub(index, Number(event.currentTarget.value))}
                    onInput={(event) => handleScrub(index, Number(event.currentTarget.value))}
                    step="0.001"
                    type="range"
                    value={progressByIndex[index] ?? 0}
                  />
                </label>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PinResetCasePanel() {
  return (
    <ResetVideoCasePanel
      ariaLabel="Case 2 Pin Insertion auto reset"
      initialStates={[
        {
          id: "pin-init-1",
          label: "Random Init 1",
          poster: "/images/pin-reset-only-1-frame.jpg",
          video: "/videos/pin-reset-only-1.mp4",
        },
        {
          id: "pin-init-2",
          label: "Random Init 2",
          poster: "/images/pin-reset-only-2-frame.jpg",
          video: "/videos/pin-reset-only-2.mp4",
        },
        {
          id: "pin-init-3",
          label: "Random Init 3",
          poster: "/images/pin-reset-only-3-frame.jpg",
          video: "/videos/pin-reset-only-3.mp4",
        },
        {
          id: "pin-init-4",
          label: "Random Init 4",
          poster: "/images/pin-reset-only-4-frame.jpg",
          video: "/videos/pin-reset-only-4.mp4",
        },
      ]}
    />
  );
}

function ZiptieResetCasePanel() {
  return (
    <section className="gpu-reset-section">
      <aside className="gpu-reset-sidenote" aria-label="Zip-tie reset procedure">
        <strong>Zip-tie reset</strong>
        <ol>
          <li>Pick up the zip-tie from anywhere on the table with one hand.</li>
          <li>Use the other hand to grab and curl its tail, aligning the strap with the head.</li>
        </ol>
      </aside>
      <ResetVideoCasePanel
        ariaLabel="Case 3 Tie Zip-tie auto reset"
        code={{
          file: ziptieResetCodeFile,
          code: ziptieResetCode,
          title: "Zip-tie auto-reset script",
          subtitle: "Case 3: Tie Zip-tie · vision-guided tail grasp",
        }}
        initialStates={[
          {
            id: "ziptie-init-1",
            label: "Random Init 1",
            poster: "/images/ziptie-reset-1-frame.jpg",
            video: "/videos/ziptie-reset-1.mp4",
          },
          {
            id: "ziptie-init-2",
            label: "Random Init 2",
            poster: "/images/ziptie-reset-2-frame.jpg",
            video: "/videos/ziptie-reset-2.mp4",
          },
          {
            id: "ziptie-init-3",
            label: "Random Init 3",
            poster: "/images/ziptie-reset-3-frame.jpg",
            video: "/videos/ziptie-reset-3.mp4",
          },
          {
            id: "ziptie-init-4",
            label: "Random Init 4",
            poster: "/images/ziptie-reset-4-frame.jpg",
            video: "/videos/ziptie-reset-4.mp4",
          },
        ]}
      />
    </section>
  );
}

function GpuResetCasePanel() {
  return (
    <section className="gpu-reset-section">
      <aside className="gpu-reset-sidenote" aria-label="GPU reset procedure">
        <strong>GPU reset</strong>
        <ol>
          <li>Pick up the GPU from anywhere on the table and move it to a pre-insertion pose.</li>
          <li>Unplug the GPU from the board to return the scene for the next trial.</li>
        </ol>
      </aside>
      <ResetVideoCasePanel
        ariaLabel="Case 4 GPU Insertion auto reset"
        code={{
          file: gpuResetCodeFile,
          code: gpuResetCode,
          title: "GPU auto-reset script",
          subtitle: "Case 4: GPU Insertion · single-arm unplug",
        }}
        initialStates={[
          {
            id: "gpu-init-1",
            label: "Random Init 1",
            poster: "/images/gpu-reset-1-frame.jpg",
            video: "/videos/gpu-reset-1.mp4",
          },
          {
            id: "gpu-init-2",
            label: "Random Init 2",
            poster: "/images/gpu-reset-2-frame.jpg",
            video: "/videos/gpu-reset-2.mp4",
          },
          {
            id: "gpu-init-3",
            label: "Random Init 3",
            poster: "/images/gpu-reset-3-frame.jpg",
            video: "/videos/gpu-reset-3.mp4",
          },
          {
            id: "gpu-init-4",
            label: "Random Init 4",
            poster: "/images/gpu-reset-4-frame.jpg",
            video: "/videos/gpu-reset-4.mp4",
          },
        ]}
      />
    </section>
  );
}

function ClaimGrid() {
  const claims = [
    {
      label: "Research loop",
      value: "End-to-end",
      text: "Agents can build environments, write policies, run trials, and revise code from real feedback.",
    },
    {
      label: "Environment",
      value: "Auto reset",
      text: "Each task exposes randomized starts, reset videos, and verification signals for repeatable experiments.",
    },
    {
      label: "Scaling",
      value: "1 to 8 agents",
      text: "Fleet experiments expose the tradeoff between wall-clock speed, token throughput, and hardware use.",
    },
  ];

  return (
    <section className="claim-section" aria-label="ENPIRE headline claims">
      <span className="claim-section__label">Thesis</span>
      <p>
        The claim is not that a single prompted model solves robotics. The claim is that a coding agent becomes useful
        when the physical world is instrumented enough for it to run a research loop.
      </p>
      <ol className="claim-list" aria-label="Key claims">
        {claims.map((claim) => (
          <li key={claim.label}>
            <strong>{claim.value}</strong>
            <span>{claim.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

type LearnedPolicy = {
  imageSrc?: string;
  title: string;
  videoSrc?: string;
};

function LearnedPolicyPanel({ policy }: { policy: LearnedPolicy }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const speeds = [4, 1, 2] as const;
  const [speedIndex, setSpeedIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerInitialTime, setViewerInitialTime] = useState(0);
  const speed = speeds[speedIndex];

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  const cycleSpeed = () => {
    setSpeedIndex((current) => (current + 1) % speeds.length);
  };

  const replay = async () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.playbackRate = speed;
    await video.play();
  };

  const openViewer = () => {
    setViewerInitialTime(videoRef.current?.currentTime ?? 0);
    setIsViewerOpen(true);
  };

  return (
    <article className="learned-policy-panel">
      <div
        className={`learned-policy-panel__surface${
          policy.videoSrc ? " learned-policy-panel__surface--video" : ""
        }`}
      >
        {policy.videoSrc ? (
          <video
            autoPlay
            loop
            muted
            onLoadedMetadata={(event) => {
              event.currentTarget.playbackRate = speed;
            }}
            playsInline
            preload="metadata"
            ref={videoRef}
            src={policy.videoSrc}
          />
        ) : null}
        {policy.imageSrc ? <Image alt="" fill sizes="(max-width: 900px) 50vw, 30vw" src={policy.imageSrc} /> : null}
        {policy.videoSrc ? (
          <button
            aria-label={`Open ${policy.title} video viewer`}
            className="learned-policy-panel__open"
            onClick={openViewer}
            type="button"
          >
            <Maximize2 aria-hidden="true" size={18} strokeWidth={1.8} />
          </button>
        ) : null}
        {policy.videoSrc ? (
          <div className="learned-policy-panel__overlay" aria-label={`${policy.title} panel controls`}>
            <button
              aria-label={`${policy.title} playback speed ${speed}x. Click to change speed.`}
              className="learned-policy-panel__speed"
              onClick={cycleSpeed}
              type="button"
            >
              {speed}x
            </button>
            <button
              aria-label={`Replay ${policy.title}`}
              className="learned-policy-panel__replay"
              onClick={replay}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={14} strokeWidth={1.9} />
            </button>
          </div>
        ) : null}
      </div>
      <h3 className="learned-policy-panel__title">{policy.title}</h3>
      {policy.videoSrc ? (
        <ExpandableVideoViewer
          initialTime={viewerInitialTime}
          isOpen={isViewerOpen}
          loop
          onClose={() => setIsViewerOpen(false)}
          onCycleSpeed={cycleSpeed}
          playbackRate={speed}
          speedLabel={`${speed}x`}
          src={policy.videoSrc}
          title={policy.title}
        />
      ) : null}
    </article>
  );
}

function LearnedPolicyPanels() {
  const policies: LearnedPolicy[] = [
    { title: "Push T", videoSrc: "/videos/pusht-success.mp4" },
    { title: "Pin Insertion", videoSrc: "/videos/pin-success.mp4" },
    { title: "GPU Insertion", videoSrc: "/videos/gpu-success.mp4" },
    { title: "Tie Ziptie", videoSrc: "/videos/ziptie-success.mp4" },
    { title: "Cut Ziptie", videoSrc: "/videos/cut-ziptie-success.mp4" },
  ];

  return (
    <>
      <p className="learned-policy-summary">
        Policies trained with ENPIRE reach a 99% pass@8 success rate across the showcased manipulation tasks.
      </p>
      <section className="learned-policy-section">
        <div className="learned-policy-grid" aria-label="Learned manipulation policy tasks">
          {policies.map((policy) => (
            <LearnedPolicyPanel key={policy.title} policy={policy} />
          ))}
        </div>
      </section>
    </>
  );
}

function IdeaTreeEmbed({ figureNumber }: { figureNumber: number }) {
  return <IdeaTreeNative figureNumber={figureNumber} />;
}

function ModuleGrid() {
  const modules = [
    {
      tag: "EN",
      title: "Environment",
      text: "Construct reset, safety, verification, and logging interfaces the agent can call.",
    },
    {
      tag: "PI",
      title: "Policy Improvement",
      text: "Generate and revise policy code from rewards, videos, traces, and failure cases.",
    },
    {
      tag: "R",
      title: "Rollout",
      text: "Run budgeted robot trials and preserve the state, action, video, and result for audit.",
    },
    {
      tag: "E",
      title: "Evolution",
      text: "Compare branches, reuse successful recipes, and prune hypotheses that fail on hardware.",
    },
  ];

  return (
    <aside className="article-sidenote" aria-label="ENPIRE decomposition">
      <ol>
        {modules.map((module) => (
          <li key={module.tag}>
            <span>{module.tag}</span>
            <div>
              <strong>{module.title}</strong>
              <p>{module.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}

function SystemIntro({ text }: { text: string }) {
  return (
    <section className="sidenote-row">
      <p>{text}</p>
      <ModuleGrid />
    </section>
  );
}

function PushTPolicySection() {
  return (
    <section className="pusht-policy-section">
      <aside className="pusht-policy-sidenote" aria-label="Push T policy prompt">
        <strong>Push-T setup</strong>
        <p>
          Clone{" "}
          <a href="https://github.com/huggingface/gym-pusht" rel="noreferrer" target="_blank">
            huggingface/gym-pusht
          </a>
          , then prompt a coding agent:
        </p>
        <blockquote>
          Write a heuristic policy, with no neural network training, to achieve a 100% success rate in the Push-T
          environment over at least 50 continuous episodes. You are not allowed to modify environment code; that is
          cheating. No cheating. Fan out a subagent team to try approaches. For each policy evaluation, save a video
          with a unique name and a <code>_success</code> or <code>_failure</code> suffix.
        </blockquote>
      </aside>
      <PushTPolicyPanel />
    </section>
  );
}

function FleetVideoPanel() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fleetVideos = [
    {
      id: "pin",
      label: "Pin Insertion",
      src: "/videos/pin-fleet.mp4",
      cropClassName: "fleet-video-panel__video--pin",
      note: "Each robot is associated with an autoresearch coding agent. The auto-reset environment keeps trying until it resets the pin to a pre-insertion pose, then the coding agent conducts online RL research.",
    },
    {
      id: "pusht",
      label: "Push T",
      src: "/videos/pusht-fleet.mp4",
      cropClassName: "fleet-video-panel__video--pusht",
      note: "The Push-T fleet view shows parallel physical rollouts for the same research loop: reset the scene, execute a candidate policy, verify the trial, and feed the result back to the agent.",
    },
  ] as const;
  const speeds = [4, 8, 1, 2] as const;
  const [activeVideoId, setActiveVideoId] = useState<(typeof fleetVideos)[number]["id"]>("pin");
  const [speedIndex, setSpeedIndex] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerInitialTime, setViewerInitialTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const activeVideo = fleetVideos.find((video) => video.id === activeVideoId) ?? fleetVideos[0];
  const speed = speeds[speedIndex];
  const percent = Math.round(progress * 100);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  const cycleSpeed = () => {
    setSpeedIndex((current) => (current + 1) % speeds.length);
  };

  const handleSelectVideo = (nextVideoId: (typeof fleetVideos)[number]["id"]) => {
    if (nextVideoId === activeVideoId) {
      return;
    }

    setActiveVideoId(nextVideoId);
    setDuration(0);
    setProgress(0);
    setIsPlaying(false);
  };

  const handleTogglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      await video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleScrub = (nextProgress: number) => {
    const video = videoRef.current;
    const clamped = Math.max(0, Math.min(1, nextProgress));
    setProgress(clamped);

    if (video && duration > 0) {
      video.currentTime = clamped * duration;
    }
  };

  const openViewer = () => {
    setViewerInitialTime(videoRef.current?.currentTime ?? 0);
    setIsViewerOpen(true);
  };

  return (
    <section className="fleet-video-section">
      <aside className="fleet-video-sidenote" aria-label="Autoresearch fleet note">
        <strong>{activeVideo.label}</strong>
        <p>{activeVideo.note}</p>
      </aside>
      <figure className="fleet-video-panel">
        <div className="fleet-video-panel__tabs" role="tablist" aria-label="Fleet research panels">
          {fleetVideos.map((video) => (
            <button
              aria-selected={activeVideo.id === video.id}
              className="fleet-video-panel__tab"
              data-active={activeVideo.id === video.id}
              key={video.id}
              onClick={() => handleSelectVideo(video.id)}
              role="tab"
              type="button"
            >
              {video.label}
            </button>
          ))}
        </div>
        <div className="fleet-video-panel__frame">
          <video
            aria-label={`${activeVideo.label} autoresearch with robot fleet`}
            className={activeVideo.cropClassName}
            key={activeVideo.id}
            loop
            muted
            onLoadedMetadata={(event) => {
              event.currentTarget.playbackRate = speed;
              setDuration(event.currentTarget.duration || 0);
            }}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onTimeUpdate={(event) => {
              const video = event.currentTarget;
              setProgress(video.duration ? video.currentTime / video.duration : 0);
            }}
            playsInline
            preload="metadata"
            ref={videoRef}
            src={activeVideo.src}
          />
          <button
            aria-label={`Playback speed ${speed}x. Click to change speed.`}
            className="fleet-video-panel__speed"
            onClick={cycleSpeed}
            type="button"
          >
            {speed}x
          </button>
          <button
            aria-label={`Expand ${activeVideo.label} fleet video`}
            className="video-panel-expand-button"
            onClick={openViewer}
            type="button"
          >
            <Maximize2 aria-hidden="true" size={16} strokeWidth={1.8} />
          </button>
        </div>
        <div className="pusht-reset-case__controls fleet-video-panel__controls" aria-label="Autoresearch fleet video controls">
          <button className="pusht-reset-case__play" onClick={handleTogglePlayback} type="button">
            {isPlaying ? "Pause" : "Play"}
          </button>
          <span className="pusht-reset-case__percent">{percent}%</span>
          <div className="pusht-reset-case__progress-shell" style={{ "--pusht-reset-progress": progress } as CSSProperties}>
            <div className="pusht-reset-case__progress-rail" aria-hidden="true">
              <span className="pusht-reset-case__progress-fill" />
            </div>
            <input
              aria-label="Autoresearch fleet video progress"
              className="pusht-reset-case__progress"
              max="1"
              min="0"
              onChange={(event) => handleScrub(Number(event.currentTarget.value))}
              step="0.001"
              type="range"
              value={progress}
            />
          </div>
        </div>
        <figcaption>{activeVideo.label} autoresearch with robot fleet</figcaption>
        <ExpandableVideoViewer
          className={activeVideo.cropClassName}
          initialTime={viewerInitialTime}
          isOpen={isViewerOpen}
          loop
          onClose={() => setIsViewerOpen(false)}
          onCycleSpeed={cycleSpeed}
          playbackRate={speed}
          speedLabel={`${speed}x`}
          src={activeVideo.src}
          title={`${activeVideo.label} autoresearch with robot fleet`}
        />
      </figure>
    </section>
  );
}

function ArticleOutline({ activeHref }: { activeHref: string }) {
  return (
    <aside className="article-outline" aria-label="Article outline">
      <nav>
        {outlineItems.map((item) => (
          <a
            aria-current={activeHref === item.href ? "true" : undefined}
            data-level={item.level ?? 1}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

// Mobile-only nav: a floating "Contents" button opens a drawer with the full
// nested outline (the desktop sidebar / mobile strip is hidden on phones).
function MobileOutline({ activeHref }: { activeHref: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="mobile-outline">
      <button
        aria-expanded={open}
        aria-label="Open table of contents"
        className="mobile-outline__trigger"
        onClick={() => setOpen(true)}
        type="button"
      >
        <List aria-hidden="true" size={16} strokeWidth={1.9} />
        Contents
      </button>

      <div className="mobile-outline__overlay" data-open={open} role="presentation" onClick={() => setOpen(false)}>
        <nav
          aria-label="Table of contents"
          className="mobile-outline__panel"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mobile-outline__head">
            <span>Contents</span>
            <button aria-label="Close table of contents" onClick={() => setOpen(false)} type="button">
              <X aria-hidden="true" size={18} strokeWidth={1.8} />
            </button>
          </div>
          <div className="mobile-outline__links">
            {outlineItems.map((item) => (
              <a
                aria-current={activeHref === item.href ? "true" : undefined}
                data-level={item.level ?? 1}
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

function ArticleContent() {
  const [activeHref, setActiveHref] = useState(outlineItems[0].href);
  let figureNumber = 0;

  useEffect(() => {
    let frame = 0;

    const syncActiveSection = () => {
      frame = 0;
      const targetY = window.innerHeight * 0.28;
      let current = outlineItems[0].href;

      for (const item of outlineItems) {
        const section = document.getElementById(item.href.slice(1));
        if (!section) {
          continue;
        }

        if (section.getBoundingClientRect().top <= targetY) {
          current = item.href;
        }
      }

      setActiveHref((previous) => (previous === current ? previous : current));
    };

    const requestSync = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(syncActiveSection);
    };

    requestSync();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
    };
  }, []);

  return (
    <section className="article-body" data-outline-open="true" id="article-content">
      <div className="article-layout">
        <ArticleOutline activeHref={activeHref} />
        <MobileOutline activeHref={activeHref} />
        <article className="article-shell">
	        <header className="article-title-block" id="article-title">
	          <h1>
	            <span>ENPIRE: Agentic Robot Policy</span>
	            <span>Self-Improvement in the Real World</span>
	          </h1>
            <div className="article-authors" aria-label="Authors and affiliations">
              <p className="article-authors__names">
                {titleAuthors.map((author, index) => (
                  <span key={author.name}>
                    {"breakBefore" in author ? <br className="article-author-break" /> : null}
                    <span className="article-author">
                      {"href" in author && author.href ? (
                        <a className="article-author-link" href={author.href} rel="noopener noreferrer" target="_blank">
                          {author.name}
                        </a>
                      ) : (
                        author.name
                      )}
                      <sup>{author.marks}</sup>
                    </span>
                    {index < titleAuthors.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
              <p className="article-authors__affiliations">
                {titleAffiliations.map((affiliation) => (
                  <span key={affiliation.mark}>
                    <sup>{affiliation.mark}</sup>
                    {affiliation.label}
                  </span>
                ))}
              </p>
              <div className="article-logo-row" aria-label="Institution logos">
                {titleLogos.map((logo) => (
                  <Image
                    alt={logo.alt}
                    className="article-logo-row__image"
                    height={logo.height}
                    key={logo.alt}
                    src={logo.src}
                    unoptimized
                    width={logo.width}
                  />
                ))}
              </div>
            </div>
	        </header>
        {article.map((block, index) => {
          const currentFigureNumber = isFigureBlock(block) ? ++figureNumber : undefined;

          if (block.type === "heading") {
            return (
              <h2 id={headingIds[block.text]} key={index}>
                {block.text}
              </h2>
            );
          }

          if (block.type === "subsection") {
            return (
              <h3 className="article-subsection" id={subsectionIds[block.text]} key={index}>
                {block.text}
              </h3>
            );
          }

          if (block.type === "subhead") {
            return (
              <p className="article-kicker" id={subheadIds[block.text]} key={index}>
                <strong>{block.text}</strong>
              </p>
            );
          }

          if (block.type === "paragraph") {
            return <p key={index}>{block.text}</p>;
          }

          if (block.type === "list") {
            return (
              <ul key={index}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          }

          if (block.type === "claim-grid") {
            return <ClaimGrid key={index} />;
          }

          if (block.type === "learned-policy-panels") {
            return <LearnedPolicyPanels key={index} />;
          }

          if (block.type === "idea-tree-embed") {
            return <IdeaTreeEmbed figureNumber={currentFigureNumber ?? 0} key={index} />;
          }

          if (block.type === "system-intro") {
            return <SystemIntro key={index} text={block.text} />;
          }

          if (block.type === "system-diagram") {
            return <FigureOneNative figureNumber={currentFigureNumber ?? 0} key={index} />;
          }

          if (block.type === "pusht-policy") {
            return <PushTPolicySection key={index} />;
          }

          if (block.type === "pusht-reset-case") {
            return <PushTResetCasePanel key={index} />;
          }

          if (block.type === "pin-reset-case") {
            return <PinResetCasePanel key={index} />;
          }

          if (block.type === "ziptie-reset-case") {
            return <ZiptieResetCasePanel key={index} />;
          }

          if (block.type === "ziptie-reward") {
            return <ZiptieRewardPanel key={index} />;
          }

          if (block.type === "gpu-reset-case") {
            return <GpuResetCasePanel key={index} />;
          }

          if (block.type === "reset-placeholder") {
            return <ResetPlaceholderPanel key={index} title={block.title} />;
          }

          if (block.type === "agent-resource-utilization") {
            return <AgentResourceUtilization figureNumber={currentFigureNumber ?? 0} key={index} />;
          }

          if (block.type === "autoenv-chart") {
            return <AutoEnvBenchChart figureNumber={currentFigureNumber ?? 0} key={index} />;
          }

          if (block.type === "autoenv-scaling-chart") {
            return <AutoEnvBenchScalingChart figureNumber={currentFigureNumber ?? 0} key={index} />;
          }

          if (block.type === "simulation-gallery-placeholder") {
            return <SimulationGalleryPlaceholder key={index} />;
          }

          if (block.type === "fleet-video") {
            return <FleetVideoPanel key={index} />;
          }

          if (block.type === "pusht-stage-progress") {
            return <PushTStageProgress figureNumber={currentFigureNumber ?? 0} key={index} />;
          }

          return <MediaBlock block={block} figureNumber={currentFigureNumber} key={index} />;
        })}
        </article>
      </div>
    </section>
  );
}

function ScrollFleetTeaser() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const fleetScrollRef = useRef<HTMLVideoElement | null>(null);
  const previousTeaserRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Mobile: skip the scroll-driven scrub entirely and just loop the fleet
    // teaser (the drone clip is hidden via CSS). The hero is a short static
    // block on phones, so there's nothing to scrub.
    if (window.matchMedia("(max-width: 820px)").matches) {
      const fleet = fleetScrollRef.current;
      if (fleet) {
        fleet.loop = true;
        fleet.style.opacity = "1";
        void fleet.play().catch(() => undefined);
      }
      return;
    }

    let frame = 0;
    let targetProgress = 0;
    let smoothProgress = 0;
    let previousTeaserActive = false;
    const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
    const smoothstep = (edge0: number, edge1: number, value: number) => {
      const t = clamp((value - edge0) / (edge1 - edge0));
      return t * t * (3 - 2 * t);
    };

    const setScrubTime = (video: HTMLVideoElement, progress: number, fallbackDuration: number) => {
      const duration = video.duration || fallbackDuration;
      const nextTime = Math.min(progress * duration, Math.max(duration - 0.04, 0));

      if (video.readyState > 0 && Math.abs(video.currentTime - nextTime) > 0.035) {
        video.currentTime = nextTime;
      }
    };

    const readScrollProgress = () => {
      const section = sectionRef.current;

      if (!section) {
        return targetProgress;
      }

      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(section.offsetHeight - window.innerHeight, 1);
      return clamp(-rect.top / scrollable);
    };

    const renderVideos = (progress: number) => {
      const fleetScroll = fleetScrollRef.current;
      const previousTeaser = previousTeaserRef.current;

      if (!fleetScroll || !previousTeaser) {
        return;
      }

      const previousFade = smoothstep(0.72, 0.86, progress);
      const fleetProgress = clamp(progress / 0.76);

      setScrubTime(fleetScroll, fleetProgress, 5.12);
      fleetScroll.style.opacity = String(1 - previousFade);
      previousTeaser.style.opacity = String(previousFade);

      if (!previousTeaserActive && previousFade > 0.38) {
        previousTeaserActive = true;
        void previousTeaser.play();
      } else if (previousTeaserActive && previousFade < 0.08) {
        previousTeaserActive = false;
        previousTeaser.pause();
      }
    };

    const tick = () => {
      smoothProgress += (targetProgress - smoothProgress) * 0.18;

      if (Math.abs(targetProgress - smoothProgress) < 0.001) {
        smoothProgress = targetProgress;
      }

      renderVideos(smoothProgress);

      if (smoothProgress === targetProgress) {
        frame = 0;
        return;
      }

      frame = window.requestAnimationFrame(tick);
    };

    const requestSync = (immediate = false) => {
      targetProgress = readScrollProgress();

      if (immediate) {
        smoothProgress = targetProgress;
        renderVideos(smoothProgress);
      }

      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(tick);
    };

    const handleScroll = () => requestSync();
    const handleResize = () => requestSync(true);

    requestSync(true);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <section className="article-hero" ref={sectionRef}>
      <div className="article-hero__sticky">
        <video
          aria-label="Fleet rises and descends with scroll"
          muted
          playsInline
          preload="auto"
          ref={fleetScrollRef}
          src={videos.fleetScroll}
        />
        <video
          aria-label="Fleet wide teaser"
          className="article-hero__video--previous"
          loop
          muted
          playsInline
          preload="auto"
          ref={previousTeaserRef}
          src={videos.previousTeaser}
        />
        <a className="scroll-cue" href="#article-content">
          Scroll to explore
        </a>
      </div>
    </section>
  );
}

export default function Home() {
  const [theme, setTheme] = useState<ThemeMode>("day");
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedTheme = window.localStorage.getItem(themeStorageKey);
      if (savedTheme === "day" || savedTheme === "night") {
        setTheme(savedTheme);
      }

      setHasHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    window.localStorage.setItem(themeStorageKey, theme);
  }, [hasHydrated, theme]);

  const isDay = theme === "day";
  return (
    <main className="figure-page" data-theme={theme}>
      <PasscodeGate>
        <header className="figure-nav" aria-label="Page controls">
          <nav className="figure-nav__controls" aria-label="Article controls">
            <button
              aria-label={isDay ? "Switch to night theme" : "Switch to daytime theme"}
              className="overlay-icon-button theme-toggle"
              onClick={() => setTheme(isDay ? "night" : "day")}
              type="button"
            >
              {isDay ? <Moon size={16} strokeWidth={1.8} /> : <Sun size={16} strokeWidth={1.8} />}
            </button>
          </nav>
        </header>
        <ScrollFleetTeaser />

        <ArticleContent />
      </PasscodeGate>
    </main>
  );
}
