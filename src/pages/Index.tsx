import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';

type GameState = 'menu' | 'playing';

interface Position {
  x: number;
  y: number;
  z: number;
}

interface Rotation {
  yaw: number;
  pitch: number;
}

interface CheatSettings {
  killaura: boolean;
  speed: boolean;
  esp: boolean;
  hub: boolean;
  fly: boolean;
  xray: boolean;
}

interface Bot {
  id: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  targetX: number;
  targetZ: number;
  name: string;
}

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [cheatMenuOpen, setCheatMenuOpen] = useState(false);
  const [cheats, setCheats] = useState<CheatSettings>({
    killaura: false,
    speed: false,
    esp: false,
    hub: false,
    fly: false,
    xray: false,
  });

  const [position, setPosition] = useState<Position>({ x: 0, y: 1.62, z: 0 });
  const [rotation, setRotation] = useState<Rotation>({ yaw: 0, pitch: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [bots, setBots] = useState<Bot[]>([]);

  const keysPressed = useRef<Set<string>>(new Set());
  const gameLoopRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const servers = [
    { name: 'FunTime', players: '1,234', status: 'online' },
    { name: 'HolyWorld', players: '856', status: 'online' },
  ];

  const botNames = ['Steve', 'Alex', 'Herobrine', 'Notch', 'Player123', 'ProGamer', 'Miner42'];

  useEffect(() => {
    if (gameState === 'playing' && bots.length === 0) {
      const initialBots: Bot[] = [];
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * 20 - 10;
        const z = Math.random() * 20 - 10;
        initialBots.push({
          id: i,
          x,
          y: 1.62,
          z,
          yaw: Math.random() * Math.PI * 2,
          targetX: x,
          targetZ: z,
          name: botNames[i % botNames.length],
        });
      }
      setBots(initialBots);
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const botInterval = setInterval(() => {
      setBots((prevBots) =>
        prevBots.map((bot) => {
          const dx = bot.targetX - bot.x;
          const dz = bot.targetZ - bot.z;
          const distance = Math.sqrt(dx * dx + dz * dz);

          if (distance < 0.5) {
            return {
              ...bot,
              targetX: bot.x + (Math.random() - 0.5) * 10,
              targetZ: bot.z + (Math.random() - 0.5) * 10,
            };
          }

          const speed = 0.03;
          const newX = bot.x + (dx / distance) * speed;
          const newZ = bot.z + (dz / distance) * speed;
          const newYaw = Math.atan2(dx, dz);

          return {
            ...bot,
            x: newX,
            z: newZ,
            yaw: newYaw,
          };
        })
      );
    }, 50);

    return () => clearInterval(botInterval);
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;



      if (!cheatMenuOpen) {
        keysPressed.current.add(e.key.toLowerCase());

        if (e.key === 'Shift') {
          setIsRunning(true);
        }

        if (e.key === ' ') {
          e.preventDefault();
          if (!isJumping) {
            setIsJumping(true);
            setVelocity((v) => ({ ...v, y: 0.15 }));
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
      if (e.key === 'Shift') {
        setIsRunning(false);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (gameState === 'playing' && !cheatMenuOpen) {
        setRotation((prev) => ({
          yaw: prev.yaw + e.movementX * 0.002,
          pitch: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev.pitch - e.movementY * 0.002)),
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameState, cheatMenuOpen, isJumping]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      const speed = isRunning ? 0.08 : 0.05;
      const speedMultiplier = cheats.speed ? 2 : 1;
      const flySpeed = cheats.fly ? 0.1 : 0;

      let dx = 0;
      let dz = 0;
      let dy = 0;

      if (keysPressed.current.has('w')) {
        dx -= Math.sin(rotation.yaw) * speed * speedMultiplier;
        dz -= Math.cos(rotation.yaw) * speed * speedMultiplier;
      }
      if (keysPressed.current.has('s')) {
        dx += Math.sin(rotation.yaw) * speed * speedMultiplier;
        dz += Math.cos(rotation.yaw) * speed * speedMultiplier;
      }
      if (keysPressed.current.has('a')) {
        dx -= Math.cos(rotation.yaw) * speed * speedMultiplier;
        dz += Math.sin(rotation.yaw) * speed * speedMultiplier;
      }
      if (keysPressed.current.has('d')) {
        dx += Math.cos(rotation.yaw) * speed * speedMultiplier;
        dz -= Math.sin(rotation.yaw) * speed * speedMultiplier;
      }

      if (cheats.fly) {
        if (keysPressed.current.has(' ')) dy += flySpeed;
        if (keysPressed.current.has('shift')) dy -= flySpeed;
      } else {
        setVelocity((v) => {
          let newY = v.y - 0.008;
          if (position.y <= 1.62 && newY < 0) {
            newY = 0;
            setIsJumping(false);
          }
          return { ...v, y: newY };
        });
        dy = velocity.y;
      }

      setPosition((prev) => ({
        x: prev.x + dx,
        y: Math.max(1.62, prev.y + dy),
        z: prev.z + dz,
      }));

      renderWorld();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, rotation, velocity, position, isRunning, cheats, isJumping]);

  const renderWorld = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, width, height / 2);

    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, height / 2, width, height / 2);

    const blockSize = 1;
    const gridSize = 20;
    const fov = 70 * (Math.PI / 180);
    const renderDistance = 20;

    const renderBlocks = [];
    for (let x = -gridSize; x < gridSize; x++) {
      for (let z = -gridSize; z < gridSize; z++) {
        const worldX = x - position.x;
        const worldZ = z - position.z;
        const distance = Math.sqrt(worldX * worldX + worldZ * worldZ);
        if (distance > renderDistance) continue;
        renderBlocks.push({ x: worldX, z: worldZ, distance });
      }
    }
    renderBlocks.sort((a, b) => b.distance - a.distance);

    for (const block of renderBlocks) {
      const dx = block.x;
      const dz = block.z;

      const relX = dx * Math.cos(-rotation.yaw) - dz * Math.sin(-rotation.yaw);
      const relZ = dx * Math.sin(-rotation.yaw) + dz * Math.cos(-rotation.yaw);

      if (relZ < 0.1) continue;

      const scale = (width / 2) / Math.tan(fov / 2) / relZ;
      const screenX = width / 2 + relX * scale;
      const blockBottom = height / 2 - ((0 - position.y) * scale) + (rotation.pitch * height);
      const blockTop = blockBottom - blockSize * scale;
      const blockWidth = blockSize * scale;

      if (screenX + blockWidth < 0 || screenX > width) continue;
      if (blockTop > height || blockBottom < 0) continue;

      const fog = Math.max(0, 1 - block.distance / renderDistance);
      const brightness = fog;

      const grassTop = [106 * brightness, 190 * brightness, 48 * brightness];
      const grassSide = [89 * brightness, 152 * brightness, 39 * brightness];
      const dirtColor = [134 * brightness, 96 * brightness, 67 * brightness];

      ctx.fillStyle = `rgb(${grassTop[0]}, ${grassTop[1]}, ${grassTop[2]})`;
      ctx.fillRect(screenX, blockTop, blockWidth, (blockBottom - blockTop) * 0.2);

      ctx.fillStyle = `rgb(${grassSide[0]}, ${grassSide[1]}, ${grassSide[2]})`;
      ctx.fillRect(screenX, blockTop + (blockBottom - blockTop) * 0.2, blockWidth, (blockBottom - blockTop) * 0.8);

      ctx.strokeStyle = `rgba(0, 0, 0, ${0.3 * fog})`;
      ctx.lineWidth = Math.max(1, scale * 0.05);
      ctx.strokeRect(screenX, blockTop, blockWidth, blockBottom - blockTop);

      if (cheats.xray && ((Math.floor(block.x + position.x) + Math.floor(block.z + position.z)) % 3 === 0)) {
        ctx.fillStyle = `rgba(64, 224, 208, ${0.6 * fog})`;
        ctx.fillRect(screenX + blockWidth * 0.2, blockTop + (blockBottom - blockTop) * 0.4, blockWidth * 0.6, (blockBottom - blockTop) * 0.4);
      }
    }

    for (const bot of bots) {
      const dx = bot.x - position.x;
      const dz = bot.z - position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance > renderDistance) continue;

      const relX = dx * Math.cos(-rotation.yaw) - dz * Math.sin(-rotation.yaw);
      const relZ = dx * Math.sin(-rotation.yaw) + dz * Math.cos(-rotation.yaw);

      if (relZ < 0.1) continue;

      const scale = (width / 2) / Math.tan(fov / 2) / relZ;
      const screenX = width / 2 + relX * scale;
      const botHeight = 1.8;
      const botWidth = 0.6;
      const botBottom = height / 2 - ((bot.y - position.y) * scale) + (rotation.pitch * height);
      const botTop = botBottom - botHeight * scale;
      const botScreenWidth = botWidth * scale;

      const fog = Math.max(0, 1 - distance / renderDistance);

      ctx.fillStyle = `rgba(100, 150, 255, ${fog})`;
      ctx.fillRect(screenX - botScreenWidth / 2, botTop, botScreenWidth, botHeight * scale);

      ctx.strokeStyle = `rgba(0, 0, 0, ${fog})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX - botScreenWidth / 2, botTop, botScreenWidth, botHeight * scale);

      ctx.fillStyle = `rgba(255, 220, 177, ${fog})`;
      ctx.fillRect(screenX - botScreenWidth / 2, botTop, botScreenWidth, botHeight * scale * 0.25);

      if (cheats.esp) {
        ctx.strokeStyle = `rgba(255, 0, 0, ${fog})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(screenX - botScreenWidth / 2 - 5, botTop - 5, botScreenWidth + 10, botHeight * scale + 10);
        
        ctx.fillStyle = `rgba(255, 255, 255, ${fog})`;
        ctx.font = '14px monospace';
        ctx.fillText(`${bot.name} [${distance.toFixed(1)}m]`, screenX - 30, botTop - 10);
      }
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(width / 2 - 10, height / 2 - 2, 20, 4);
    ctx.fillRect(width / 2 - 2, height / 2 - 10, 4, 20);
  };

  const startGame = (serverName: string) => {
    setSelectedServer(serverName);
    setGameState('playing');
    if (canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  const toggleCheat = (cheat: keyof CheatSettings) => {
    setCheats((prev) => ({ ...prev, [cheat]: !prev[cheat] }));
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A1F2C] via-[#2D1B4E] to-[#1A1F2C] flex items-center justify-center p-8">
        <div className="max-w-2xl w-full space-y-8 animate-fade-in">
          <div className="text-center space-y-4">
            <h1 className="text-7xl font-black tracking-wider text-[#ea384c] drop-shadow-[0_0_30px_rgba(234,56,76,0.5)] pixelated">
              SLIDECLIENT
            </h1>
            <p className="text-gray-400 text-sm">v1.0 | Premium Edition</p>
          </div>

          <Card className="bg-black/40 border-gray-700 backdrop-blur-sm p-6 space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Icon name="Server" className="text-[#ea384c]" />
              Выбери сервер
            </h2>

            <div className="space-y-3">
              {servers.map((server) => (
                <div
                  key={server.name}
                  className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-4 hover:border-[#ea384c] transition-all cursor-pointer group"
                  onClick={() => startGame(server.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-white group-hover:text-[#ea384c] transition-colors">
                        {server.name}
                      </h3>
                      <p className="text-sm text-gray-400">Игроков онлайн: {server.players}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-500 text-sm font-semibold">{server.status.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="text-center space-y-2">
            <p className="text-gray-500 text-sm">Управление: WASD - движение | Shift - бег | Space - прыжок | Вкладка SLIDE - читы</p>
            <p className="text-gray-600 text-xs">Made with ❤️ by SlideClient Team</p>
          </div>
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@900&display=swap');
          .pixelated {
            font-family: 'Rubik', sans-serif;
            text-transform: uppercase;
            letter-spacing: 0.15em;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />

      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700">
          <button
            onClick={() => setCheatMenuOpen(!cheatMenuOpen)}
            className="text-[#ea384c] text-lg font-bold hover:text-white transition-colors"
          >
            SLIDE
          </button>
        </div>
        <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700">
          <p className="text-white text-sm font-mono">
            {selectedServer} | XYZ: {position.x.toFixed(1)}, {position.y.toFixed(1)}, {position.z.toFixed(1)}
          </p>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 pointer-events-none">
        <div className="relative w-32 h-32 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-br from-[#d4a574] to-[#8b6f47] rounded-sm transform rotate-12 shadow-2xl">
            <div className="absolute inset-2 border-2 border-black/20"></div>
            <div className="absolute bottom-0 left-1/2 w-8 h-3 bg-[#654321] -translate-x-1/2 translate-y-1"></div>
          </div>
        </div>
      </div>

      {cheatMenuOpen && (
        <div className="absolute top-20 left-4 w-80 animate-scale-in">
          <Card className="bg-black/90 border-[#ea384c] backdrop-blur-md p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                <h3 className="text-2xl font-bold text-[#ea384c]">CHEAT MENU</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCheatMenuOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <Icon name="X" />
                </Button>
              </div>

              {Object.entries(cheats).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-900/50 to-transparent hover:from-gray-800/50 transition-all"
                >
                  <span className="text-white font-semibold capitalize">{key}</span>
                  <Switch checked={value} onCheckedChange={() => toggleCheat(key as keyof CheatSettings)} />
                </div>
              ))}

              <div className="pt-3 border-t border-gray-700">
                <Button
                  onClick={() => {
                    setGameState('menu');
                    document.exitPointerLock();
                  }}
                  variant="outline"
                  className="w-full border-[#ea384c] text-[#ea384c] hover:bg-[#ea384c] hover:text-white"
                >
                  <Icon name="LogOut" className="mr-2" />
                  Выйти в меню
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}


    </div>
  );
};

export default Index;