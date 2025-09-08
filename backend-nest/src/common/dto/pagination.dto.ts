import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({
    example: 100,
    description: 'Total number of items',
  })
  total: number;

  @ApiProperty({
    example: 10,
    description: 'Number of items per page',
  })
  limit: number;

  @ApiProperty({
    example: 0,
    description: 'Number of items to skip',
  })
  offset: number;
}
