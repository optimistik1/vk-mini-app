import { View, SplitLayout, SplitCol } from '@vkontakte/vkui';
import { useActiveVkuiLocation, useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { Menu } from './panels/Menu';
import { Home as Sudoku } from './panels/Home';
import { Puzzle } from './panels/Puzzle';
import { Leaderboard } from './panels/Leaderboard';

export const App = () => {
  const { panel: activePanel = 'menu' } = useActiveVkuiLocation();
  const routeNavigator = useRouteNavigator();

  const handleSelectGame = (game: 'sudoku' | 'puzzle') => {
    routeNavigator.push(`/${game}`);
  };

  return (
    <SplitLayout>
      <SplitCol>
        <View activePanel={activePanel}>
          <Menu id="menu" onSelectGame={handleSelectGame} />
          <Sudoku id="sudoku" />
          <Puzzle id="puzzle" />
          <Leaderboard id="leaderboard" />
        </View>
      </SplitCol>
    </SplitLayout>
  );
};