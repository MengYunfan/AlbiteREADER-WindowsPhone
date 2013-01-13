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
using System.IO;
using System.Xml.Linq;
using System.Linq;
using System.Collections.Generic;

namespace SvetlinAnkov.AlbiteREADER.Model.Containers.Epub
{
    public class OpenContainerFile
    {
        /// <summary>
        /// For more info check http://idpf.org/epub/30/spec/epub30-ocf.html#sec-container-metainf
        /// </summary>
        public static string Path { get { return "META-INF/container.xml"; } }
        public static string XmlNamespace { get { return "{urn:oasis:names:tc:opendocument:xmlns:container}"; } }

        public OpenContainerFile(XDocument doc)
        {
            XElement element = doc.Descendants(XmlNamespace + "rootfile").First();
            OpfPath = (string) element.Attribute("full-path");
        }

        public string OpfPath { get; private set; }
    }
}
