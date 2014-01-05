﻿using System;
using System.Collections;
using System.Collections.Generic;

namespace SvetlinAnkov.Albite.Core.Collections
{
    public class CircularBuffer<TValue> : IEnumerable<TValue>, IEnumerable
    {
        public int MaximumCapacity
        {
            get { return data.Length; }
        }

        // array holding items
        protected TValue[] data;

        // offset of current item
        protected int offset = 0;

        // total number of items
        protected int size = 0;

        public CircularBuffer(int maximumCapacity)
        {
            if (maximumCapacity <= 0)
            {
                throw new ArgumentException("maximumCapacity must be positive");
            }

            data = new TValue[maximumCapacity];
        }

        public CircularBuffer(IEnumerable<TValue> collection)
        {
            if (collection == null)
            {
                throw new NullReferenceException("collection is null");
            }

            List<TValue> list = new List<TValue>();

            foreach (TValue item in collection)
            {
                list.Add(item);
            }

            TValue[] data = list.ToArray();

            if (data.Length == 0)
            {
                throw new ArgumentException("collection is empty");
            }

            this.data = data;
        }

        public void Clear()
        {
            offset = 0;
            size = 0;
        }

        public int Count
        {
            get { return size; }
        }

        public bool IsEmpty
        {
            get { return Count == 0; }
        }

        public bool IsFull
        {
            get { return Count == MaximumCapacity; }
        }

        public void AddHead(TValue item)
        {
            offset--;

            if (offset < 0)
            {
                // This should mean that offset == -1
                // but we are handling it in a generic way
                offset = MaximumCapacity + offset;
            }

            data[offset] = item;

            if (!IsFull)
            {
                // increment the size only if not full
                size++;
            }
        }

        public TValue GetHead()
        {
            return getHead(false);
        }

        public TValue RemoveHead()
        {
            return getHead(true);
        }

        private TValue getHead(bool remove)
        {
            throwIfEmpty();

            // get head
            TValue item = data[offset];

            // remove?
            if (remove)
            {
                // move offset to the right, not forgetting it might wrap
                offset = wrapIndex(offset + 1);

                // decrement total size
                size--;
            }

            return item;
        }

        public void AddTail(TValue item)
        {
            if (IsFull)
            {
                // move the head
                offset = wrapIndex(offset + 1);
            }
            else
            {
                size++;
            }

            int index = wrapIndex(offset + size - 1);

            data[index] = item;
        }

        public TValue GetTail()
        {
            return getTail(false);
        }

        public TValue RemoveTail()
        {
            return getTail(true);
        }

        private TValue getTail(bool remove)
        {
            throwIfEmpty();

            // get index
            int index = wrapIndex(offset + size - 1);

            // get head
            TValue item = data[index];

            // remove?
            if (remove)
            {
                // decrement total size
                size--;
            }

            return item;
        }

        private void throwIfEmpty()
        {
            if (IsEmpty)
            {
                throw new InvalidOperationException("Stack is empty");
            }
        }

        private int wrapIndex(int index)
        {
            return index % MaximumCapacity;
        }

        public IEnumerator<TValue> GetEnumerator()
        {
            return new GenericEnumerator<TValue>(data);
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return data.GetEnumerator();
        }
    }
}