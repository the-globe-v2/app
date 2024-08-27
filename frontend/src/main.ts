import './styles/style.css';
import { Globe } from './components/Globe';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div id="globe-container"></div>
`;

const globeContainer = document.getElementById('globe-container');
if (globeContainer) {
    new Globe(globeContainer);
}