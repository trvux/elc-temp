import React from "react";
import { News } from "../../domain/types";
import { NewsCard } from "./NewsCard";

interface NewsListProps {
  newsList: News[];
}

export const NewsList: React.FC<NewsListProps> = ({ newsList }) => {
  if (newsList.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Chưa có tin tức nào.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {newsList.map((news) => (
        <NewsCard key={news.id} news={news} />
      ))}
    </div>
  );
};
