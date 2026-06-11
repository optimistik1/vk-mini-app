import { render, screen, fireEvent } from '@testing-library/react';
import { NumberPad } from '../../components/NumberPad';
import { useGameStore } from '../../store/gameStore';

jest.mock('../../store/gameStore', () => ({
  useGameStore: jest.fn(),
}));

jest.mock('../../hooks/useSound', () => ({
  useSound: () => ({
    playClick: jest.fn(),
  }),
}));

describe('NumberPad', () => {
  const mockSetNumber = jest.fn();
  const mockClearCell = jest.fn();

  const createMockBoard = () => {
    return Array(9).fill(Array(9).fill({ value: 0, isFixed: false, notes: [] }));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        setNumber: mockSetNumber,
        clearCell: mockClearCell,
        noteMode: false,
        board: createMockBoard(),
        isComplete: false,
        isGameOver: false,
      };
      return selector(state);
    });
  });

  it('should render number buttons 1-9', () => {
    render(<NumberPad />);
    
    for (let i = 1; i <= 9; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }
  });

  it('should render clear button', () => {
    render(<NumberPad />);
    expect(screen.getByText('⌫')).toBeInTheDocument();
  });

  it('should call setNumber when number button is clicked', () => {
    render(<NumberPad />);
    
    fireEvent.click(screen.getByText('5'));
    expect(mockSetNumber).toHaveBeenCalledWith(5);
  });

  it('should call clearCell when clear button is clicked', () => {
    render(<NumberPad />);
    
    fireEvent.click(screen.getByText('⌫'));
    expect(mockClearCell).toHaveBeenCalled();
  });

  it('should not render when game is complete', () => {
    (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        setNumber: mockSetNumber,
        clearCell: mockClearCell,
        noteMode: false,
        board: createMockBoard(),
        isComplete: true,
        isGameOver: false,
      };
      return selector(state);
    });
    
    const { container } = render(<NumberPad />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when game is over', () => {
    (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        setNumber: mockSetNumber,
        clearCell: mockClearCell,
        noteMode: false,
        board: createMockBoard(),
        isComplete: false,
        isGameOver: true,
      };
      return selector(state);
    });
    
    const { container } = render(<NumberPad />);
    expect(container.firstChild).toBeNull();
  });
});