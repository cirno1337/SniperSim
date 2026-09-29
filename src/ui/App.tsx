import { useState } from "react";
import type { ShotResult } from "../game/types";
import { GameScreen } from "./components/GameScreen";
import { Menu } from "./components/Menu";
import { Summary } from "./components/Summary";
import { bestKey, recordBest, setSoundEnabled, soundEnabled } from "./storage";
import type { SessionSetup } from "./useGame";
import { sessionStats } from "../game/session";

type Screen = { id: "menu" } | { id: "game"; run: number } | { id: "summary"; results: ShotResult[]; newBest: boolean };

const DEFAULT_SETUP: SessionSetup = { mode: "training", difficultyId: "easy", weaponId: "random", lengthId: "5", shots: 5 };

export function App() {
  const [screen, setScreen] = useState<Screen>({ id: "menu" });
  const [setup, setSetup] = useState(DEFAULT_SETUP);
  const [sound, setSound] = useState(soundEnabled);
  const [run, setRun] = useState(0);

  const start = (s: SessionSetup) => {
    setSetup(s);
    setRun((r) => r + 1);
    setScreen({ id: "game", run: run + 1 });
  };

  if (screen.id === "menu") return <Menu initial={setup} onStart={start} />;
  if (screen.id === "summary") {
    return <Summary setup={setup} results={screen.results} newBest={screen.newBest} onAgain={() => start(setup)} onMenu={() => setScreen({ id: "menu" })} />;
  }
  return (
    <GameScreen
      key={screen.run}
      setup={setup}
      sound={sound}
      onToggleSound={() => {
        setSound(!sound);
        setSoundEnabled(!sound);
      }}
      onExit={() => setScreen({ id: "menu" })}
      onFinish={(results) => setScreen({ id: "summary", results, newBest: recordBest(bestKey(setup), sessionStats(results).score) })}
    />
  );
}
