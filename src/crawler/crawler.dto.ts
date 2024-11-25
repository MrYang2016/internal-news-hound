import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min, IsString, MaxLength, IsUrl, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetNewsDto {
  // page
  @ApiProperty({
    description: '页码',
    required: true,
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page: number;
  // size
  @ApiProperty({
    description: '每页数量',
    required: true,
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Max(1000)
  size: number;

  // 新闻来源id
  @ApiProperty({
    description: '新闻来源',
    required: true,
  })
  @IsOptional()
  @IsString()
  sourceName: string;
}

class News {
  @ApiProperty({
    description: '新闻id',
    required: true,
  })
  id: number;

  @ApiProperty({
    description: '新闻标题',
    required: true,
  })
  title: string;

  @ApiProperty({
    description: '新闻时间',
    required: true,
  })
  time: Date;

  @ApiProperty({
    description: '新闻高亮',
    required: true,
  })
  highlight: string;

  @ApiProperty({
    description: '新闻链接',
    required: true,
  })
  link: string;

  @ApiProperty({
    description: '新闻摘要',
    required: true,
  })
  summary: string;
}

export class GetNewsResponseDto {
  @ApiProperty({
    description: '新闻列表',
    type: [News],
  })
  news: News[];
}

export class AddSourceDto {
  @ApiProperty({
    description: '新闻来源',
    required: true,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: '新闻来源官网',
    required: true,
  })
  @IsUrl()
  website: string;
}
