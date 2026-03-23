/**
 * UI helpers generator (merged UIState + UIComponents)
 */

export function generateUITs(): string {
  return `/**
 * UI helpers for screen management and DOM utilities
 */

export function showLoadingScreen(): void {
  document.getElementById('loadingSection')!.classList.add('active');
  document.getElementById('loginSection')!.classList.remove('active');
  document.getElementById('appSection')!.classList.remove('active');
}

export function showLoginScreen(): void {
  document.getElementById('loadingSection')!.classList.remove('active');
  document.getElementById('loginSection')!.classList.add('active');
  document.getElementById('appSection')!.classList.remove('active');
}

export function showAppScreen(): void {
  document.getElementById('loadingSection')!.classList.remove('active');
  document.getElementById('loginSection')!.classList.remove('active');
  document.getElementById('appSection')!.classList.add('active');
}

export function showStatus(elementId: string, message: string, isError: boolean = false): void {
  const statusEl = document.getElementById(elementId) as HTMLElement;
  statusEl.textContent = message;
  statusEl.style.display = 'block';

  if (isError) {
    statusEl.classList.add('error');
  } else {
    statusEl.classList.remove('error');
  }
}

export function createButton(
  label: string,
  variant: 'primary' | 'secondary' | 'danger',
  onClick: () => void
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  if (variant !== 'primary') {
    button.className = variant;
  }
  button.addEventListener('click', onClick);
  return button;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('en-US', options);
}

export function clearContainer(container: HTMLElement): void {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

export function createMediaPreview(url: string, mediaType: string): HTMLElement {
  const container = document.createElement('div');
  container.className = 'media-preview';

  if (mediaType === 'image') {
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Image preview';
    img.onerror = () => {
      container.innerHTML = '<p style="color: #999;">Unable to load image</p>';
    };
    container.appendChild(img);
  } else if (mediaType === 'audio') {
    const audio = document.createElement('audio');
    audio.src = url;
    audio.controls = true;
    container.appendChild(audio);
  } else if (mediaType === 'video') {
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    container.appendChild(video);
  } else {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.textContent = url;
    container.appendChild(link);
  }

  return container;
}

export function createTagsDisplay(tags: string[]): HTMLElement {
  const container = document.createElement('div');
  container.className = 'tags-container';

  tags.forEach(tag => {
    const tagEl = document.createElement('span');
    tagEl.className = 'tag';
    tagEl.textContent = tag;
    container.appendChild(tagEl);
  });

  return container;
}
`;
}
