import React, { useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

const ItemTypes = {
  CARD: "card",
};

function Card({
  id,
  children,
  index,
  moveCard,
}: React.PropsWithChildren<{
  index: number;
  id: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
}>) {
  const ref = React.useRef(null);
  const [, drop] = useDrop({
    accept: ItemTypes.CARD,
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });
  const [{ isDragging }, drag] = useDrag({
    item: { type: ItemTypes.CARD, id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));
  return (
    <div ref={ref} style={{ opacity }}>
      {children}
    </div>
  );
}

function Plugins() {
  const [cards, setCards] = useState([
    { id: 1, text: "Card 1" },
    { id: 2, text: "Card 2" },
    { id: 3, text: "Card 3" },
  ]);
  const moveCard = (dragIndex, hoverIndex) => {
    const draggedCard = cards[dragIndex];
    setCards(
      cards
        .filter((card, index) => index !== dragIndex)
        .slice(0, hoverIndex)
        .concat([draggedCard])
        .concat(
          cards.filter((card, index) => index !== dragIndex).slice(hoverIndex)
        )
    );
  };
  return (
    <DndProvider backend={HTML5Backend}>
      {cards.map((card, index) => (
        <Card key={card.id} id={card.id} index={index} moveCard={moveCard}>
          {card.text}
        </Card>
      ))}
    </DndProvider>
  );
}

export default Plugins;
