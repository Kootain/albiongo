package replay

type sequenceChunk[T any] struct {
	startIdx int
	endIdx   int
	seq      []T
}

type Sequence[T any] struct {
	chunks       []*sequenceChunk[T]
}

func (s *Sequence[T]) getChunk(idx int) *sequenceChunk[T] {
	lastIdx := idx - 1
	if len(s.chunks) == 0 {
		return nil
	}

	low := 0
	high := len(s.chunks) - 1

	for low <= high {
		mid := low + (high-low)/2
		chunk := s.chunks[mid]

		if lastIdx >= chunk.startIdx && lastIdx <= chunk.endIdx {
			return chunk
		} else if lastIdx < chunk.startIdx {
			high = mid - 1
		} else {
			low = mid + 1
		}
	}
	newSeq := &sequenceChunk[T]{
		startIdx: lastIdx,
		endIdx:   lastIdx,
		seq:      make([]T, 0),
	}
	s.chunks = append(s.chunks, newSeq)
	return newSeq
}

func (s *Sequence[T]) Get(idx int) (t T) {
	chunk := s.getChunk(idx)
	if chunk == nil {
		return t
	}
	return chunk.seq[idx-chunk.startIdx]
}

func (s *Sequence[T]) Append(idx int, t T) {
	targetChunk := s.chunks[len(s.chunks)-1]
	if idx < targetChunk.endIdx {
		// should not happend, but can be done
		s.getChunk(idx)
	}
}
