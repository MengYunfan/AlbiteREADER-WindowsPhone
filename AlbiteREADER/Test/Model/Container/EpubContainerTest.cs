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
using SvetlinAnkov.AlbiteREADER.Utils;
using System.IO;
using SvetlinAnkov.AlbiteREADER.Model.Container.Epub;
using System.Diagnostics;
using System.Collections.Generic;

namespace SvetlinAnkov.AlbiteREADER.Test.Model.Container
{
    public class EpubContainerTest : TestCase
    {
        private string epubPath;

        public EpubContainerTest(string epubPath)
        {
            this.epubPath = epubPath;
        }

        protected override void  TestImplementation()
        {
            Log("Opening ePub {0}", epubPath);

            using (AlbiteIsolatedStorage iso = new AlbiteIsolatedStorage(epubPath))
            {
                using (AlbiteResourceStorage res = new AlbiteResourceStorage(epubPath))
                {
                    res.CopyTo(iso);
                }

                using (Stream inputStream = iso.GetStream(FileAccess.Read))
                {
                    using (AlbiteZipContainer zip = new AlbiteZipContainer(inputStream))
                    {
                        using (AlbiteIsolatedStorage outputStorage = new AlbiteIsolatedStorage("Test/epub/"))
                        {
                            EpubContainer epub = new EpubContainer(zip);
                            dumpEpub(epub);
                            epub.Install(outputStorage);
                        }
                    }
                }
            }
        }

        private void dumpEpub(EpubContainer epub)
        {
            dumpOcf(epub.Ocf);
            dumpOpf(epub.Opf);
            dumpNcx(epub.Ncx);
        }

        private void dumpOcf(OpenContainerFile ocf)
        {
            Log("Opf Path: {0}", ocf.OpfPath);
        }

        private void dumpOpf(OpenPackageFile opf)
        {
            // Metadata
            Log("Author: {0}", opf.Author);
            Log("Title: {0}", opf.Title);
            Log("Language: {0}", opf.Language);
            Log("Publisher: {0}", opf.Publisher);
            Log("Publication Date: {0}", opf.PublicationDate);
            Log("Rights: {0}", opf.Rights);

            // Manifest
            foreach (string id in opf.ItemIds)
            {
                Log("Item {0} => {1}", id, opf.Item(id));
            }

            // Spine
            foreach (string id in opf.Spine)
            {
                Log("Spine {0} => {1}", id, opf.Item(id));
            }

            // Ncx location
            Log("Ncx Path: {0}", opf.NcxPath);
        }

        private void dumpNcx(NavigationControlFile ncx)
        {
            // Dump the navigation map
            dumpNavPoint(ncx.NavigationMap.FirstPoint, 0);

            // Dump the navigation lists
            foreach (NavigationControlFile.NavList navList in ncx.NavigationLists)
            {
                dumpNavList(navList);
            }
        }

        private void dumpNavPoint(NavigationControlFile.NavPoint navPoint, int level)
        {
            if (navPoint == null)
            {
                return;
            }

            Log("NavPoint. Level: {0}, Label: {1}, Content: {2}",
                level, navPoint.Label, navPoint.Src);

            dumpNavPoint(navPoint.FirstChild, level + 1);
            dumpNavPoint(navPoint.NextSibling, level);
        }

        private void dumpNavList(NavigationControlFile.NavList navList)
        {
            Log("NavList {0}", navList.Label);

            NavigationControlFile.NavTarget navTarget = navList.FirstTarget;

            while (navTarget != null)
            {
                Log("NavTarget. Label: {0}, Content: {1}",
                    navTarget.Label, navTarget.Src);

                navTarget = navTarget.NextSibling;
            }
        }
    }
}
