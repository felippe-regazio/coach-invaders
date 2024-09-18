const score = {};
const $shooter = document.getElementById('shooter');
const $boundarie = document.getElementById('boundarie');
const $battlefield = document.getElementById('battlefield');

function updateScore(update = {}) {
  const {targets, hits, errors, maxInvaders, points } = Object.assign(score, update);
  const display = document.querySelector('#score > p');
  
  display.textContent = `Alvos: ${targets} | Acertos: ${hits} | Invasores: ${errors}/${maxInvaders} | Pontos: ${points}`;
}

function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function onlyNumbers(str) {
  return Number(String(str || '').split('.')[0].replace(/\D+/g, '') || 0);
}

function collided(_$chair, target) {
  if (!target.classList.contains('crossed')) {
    target.classList.add('hitted');
    target.textContent = '💥';
  
    setTimeout(() => {
      target.remove();
    }, 200);
    
    updateScore({
      hits: ++score.hits,
      points: score.points += onlyNumbers(target.dataset.points)
    });
  }
}

function checkChairCollision($chair) {
  const threshold = 20;
  const chairTop = onlyNumbers($chair.style.top);
  const chairLeft = onlyNumbers($chair.style.left);

  for(let i = 0; i < threshold; i++) {
    const inSight = [
      chairLeft+i,
      chairLeft-i
    ]
      .map(check => Array.from(document.querySelectorAll(`.target[data-left="${check}"]:not(.hitted)`)))
      .flat();

    inSight.forEach($target => {
      $target.textContent = '🙅🏻‍♂️';

      if ((onlyNumbers($target.style.top) + 5) >= chairTop) {
        collided($chair, $target);
      }
    });
  }
}

function checkGameOver() {
  if ((score.errors || 0) > (score.hits || 0) || score.errors >= score.maxInvaders) {
    game.gameover();
  }
}

function hasTargetCrossedTheBoundarie($target) {
  const limit = $boundarie.getBoundingClientRect().y;
  const crossed = $target.getBoundingClientRect().y > limit;

  if (crossed) {
    $target.classList.add('crossed');
    $target.textContent = '🤷🏻‍♂️';
  }

  return crossed;
}

function createChair(x) {
  const $chair = Object.assign(document.createElement('span'), {
    classList: ['chair'],
    textContent: '🪑',
    style: `
      top: 100%;
      transform: rotate(${randomInRange(0, 360)}deg);
    `,
  });

  $chair.style.left = x;
  $battlefield.append($chair);

  return $chair;
}

function throwChair($chair) {
  const moveChair = setInterval(() => {
    const top = onlyNumbers($chair.style.top);
    
    if (top <= 0) {
      $chair.remove();
      clearInterval(moveChair);
    }

    $chair.style.top = `${top - 1}%`;
    checkChairCollision($chair);
  }, 5);
} 

function shoot() {
  $shooter.textContent = '🙋‍♂️';

  setTimeout(() => {
    $shooter.textContent = '🙎‍♂️';
  }, 150);

  throwChair(createChair($shooter.style.left));
}

function spawnTarget(speedRange) {
  const speed = randomInRange(...speedRange);
  const points = (5100 - speed) / 100;

  const $target = Object.assign(document.createElement('span'), {
    textContent: "🙎🏻‍♂️",
    classList: ['target'],
  });

  $target.style.top = `${randomInRange(20, 50)}%`;
  $target.style.left = `${randomInRange(20, 95)}%`;
  
  $battlefield.append($target);
  
  const rect = $target.getBoundingClientRect();
  
  $target.dataset.top = onlyNumbers(rect.y);
  $target.dataset.left = onlyNumbers(rect.x);
  $target.dataset.points = points;

  updateScore({ targets: ++score.targets });
  
  const moveTarget = setInterval(() => {
    if (!$target.classList.contains('hitted') || $target.classList.contains('crossed')) {
      const newTop = `${onlyNumbers($target.style.top) + 10}%`;
      $target.style.top = newTop;
    }

    if (hasTargetCrossedTheBoundarie($target)) {
      updateScore({ errors: ++score.errors });
      clearInterval(moveTarget);
      checkGameOver();
    }
  }, speed);
}

function clearAllTargets() {
  document.querySelectorAll('.target').forEach(item => item.remove());
}

// ------------------------------------------------------------

const game = {
  running: null,
  
  defaults: {
    spawnTargetInterval: 1000,
    targetSpeedRange: [200, 500],
    maxInvaders: 10
  },
  
  start: (options = {}) => {
    const config = { ...game.defaults, ...options };

    updateScore({
      maxInvaders: config.maxInvaders,
      targets: 0,
      hits: 0,
      errors: 0,
      points: 0,
    });

    document.getElementById('start').style.display = 'none';
    
    game.running = setInterval(() => {
      spawnTarget(config.targetSpeedRange);
    }, config.spawnTargetInterval);
  },

  stop: () => {
    clearInterval(game.running);
    document.getElementById('gameover').style.display = 'none';
    document.getElementById('start').style.display = 'block';
    clearAllTargets();
  },

  gameover: () => {
    clearInterval(game.running);
    document.getElementById('start').style.display = 'none';
    document.getElementById('gameover').style.display = 'block';
    clearAllTargets();
  }
}


window.addEventListener('keyup', event => {
  if (event.code === 'Space') {
    shoot();
  }

  if (event.code === 'Escape') {
    game.stop();
  }
});

document.body.onpointermove = event => {
  const { clientX } = event;

  $shooter.animate({
    left: `${clientX}px`
  }, {
    duration: 200,
    fill: "forwards"
  });

  $shooter.style.left = `${clientX}px`;
}

// ------------------------------------------------------------

function initialize(event) {
  const difficultTunings = {};
  const difficult = event.target.querySelector('[type=radio]:checked').value;
  
  if (difficult === 'easy') {
    Object.assign(difficultTunings, {
      spawnTargetInterval: 1000,
      targetSpeedRange: [400, 1000],
      maxInvaders: 100
    });
  }

  if (difficult === 'hard') {
    Object.assign(difficultTunings, {
      spawnTargetInterval: 500,
      targetSpeedRange: [200, 500],
      maxInvaders: 5
    });
  }

  game.start(difficultTunings);
};
