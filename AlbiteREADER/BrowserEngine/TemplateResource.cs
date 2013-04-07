﻿using System;
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Ink;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;
using SvetlinAnkov.Albite.Core.Utils;

namespace SvetlinAnkov.Albite.READER.BrowserEngine
{
    public class TemplateResource : Template
    {
        private readonly string filename;

        public TemplateResource(string filename)
        {
            this.filename = filename;

            using (AlbiteResourceStorage res = new AlbiteResourceStorage(filename))
            {
                base.setTemplate(res.ReadAsString());
            }
        }

        public void SaveToStorage(string filename = null)
        {
            using (AlbiteIsolatedStorage iso =
                new AlbiteIsolatedStorage(filename != null ? filename : this.filename))
            {
                iso.Write(GetOutput());
            }
        }
    }
}