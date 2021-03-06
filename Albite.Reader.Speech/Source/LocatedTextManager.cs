﻿using System;
using System.Collections.Generic;
using System.Linq;
using Windows.Foundation;

namespace Albite.Reader.Speech
{
    public class LocatedTextManager<TLocation>
    {
        public event TypedEventHandler<LocatedTextManager<TLocation>, ILocatedText<TLocation>> TextReached;

        private ILocatedText<TLocation>[] locations_;
        public IEnumerable<ILocatedText<TLocation>> Locations
        {
            get
            {
                return Array.AsReadOnly<ILocatedText<TLocation>>(locations_);
            }
        }

        private ILocatedTextManagerUpdater updater;

        public LocatedTextManager(
            ILocatedText<TLocation>[] locations, ILocatedTextManagerUpdaterProxy proxy)
        {
            locations_ = locations;
            current_ = locations_.First();
            updater = new LocatedTextManagerUpdater(this);
            proxy.SetUpdater(updater);
        }

        private ILocatedText<TLocation> current_ = null;
        public ILocatedText<TLocation> Current
        {
            get
            {
                lock (locations_)
                {
                    return current_;
                }
            }
            set
            {
                lock (locations_)
                {
                    if (!locations_.Contains(value))
                    {
                        throw new InvalidOperationException("Current does not come from Locations");
                    }

                    current_ = value;
                }
            }
        }

        public ILocatedText<TLocation> this[int index]
        {
            get
            {
                lock (locations_)
                {
                    return locations_[index];
                }
            }
        }

        public ILocatedText<TLocation> this[TLocation location]
        {
            get
            {
                lock (locations_)
                {
                    return locations_.Single(t => t.Location.Equals(location));
                }
            }
        }

        public interface ILocatedTextManagerUpdater
        {
            void Update(int index);
        }

        private class LocatedTextManagerUpdater : ILocatedTextManagerUpdater
        {
            private LocatedTextManager<TLocation> manager;

            public LocatedTextManagerUpdater(LocatedTextManager<TLocation> manager)
            {
                this.manager = manager;
            }

            public void Update(int index)
            {
                lock (manager.locations_)
                {
                    ILocatedText<TLocation> t = manager[index];

                    // Do not trigger an update for 0-length text elements
                    if (t.Text.Length > 0)
                    {
                        manager.current_ = t;
                        if (manager.TextReached != null)
                        {
                            manager.TextReached(manager, t);
                        }
                    }
                }
            }
        }

        public interface ILocatedTextManagerUpdaterProxy
        {
            void SetUpdater(ILocatedTextManagerUpdater updater);
        }
    }
}
