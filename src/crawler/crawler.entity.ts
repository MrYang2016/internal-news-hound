import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';

// 新闻来源
@Entity()
@Unique(['name'])
export class NewsSource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '名称', length: 100, type: 'varchar' })
  name: string;

  // 官网
  @Column({ comment: '官网', length: 2000, type: 'varchar' })
  website: string;

  // OneToMany
  @OneToMany(() => News, (news) => news.source)
  news: News[];
}

// ALTER DATABASE `你的数据库名` CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
// @ts-ignore
@Entity()
@Index('Idx_source_name', ['source'])
export class News {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '标题', length: 2000, type: 'varchar' })
  title: string;

  @Column({ comment: '链接', length: 2000, type: 'varchar' })
  link: string;

  @Column({ comment: '摘要', length: 2000, type: 'varchar' })
  summary: string;

  @Column({ comment: '时间', type: 'datetime' })
  time: Date;

  @Column({ comment: '高亮', length: 100, type: 'varchar', default: '' })
  highlight: string;

  // ManyToOne
  @ManyToOne(() => NewsSource, (source) => source.news, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: 'sourceName', referencedColumnName: 'name' })
  source: NewsSource;
}
