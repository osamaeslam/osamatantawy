
using RaneenProject.Data;
using RaneenProject.Models;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Xamarin.Forms;
using Xamarin.Forms.Xaml;

namespace RaneenProject.Views
{
    [XamlCompilation(XamlCompilationOptions.Compile)]
    public partial class HomePage : ContentPage
    {
        //ProductDB firebaseHelper = new ProductDB();

        public ObservableCollection<OfferImage> WideOffers { get; set; }
        public ObservableCollection<OfferImage> WideOffers2 { get; set; }
        public HomePage()
        {
            InitializeComponent();

            CVwideOffers.ItemsSource = WideOffers = new ObservableCollection<OfferImage> {
                new OfferImage { Name="wideOffer1" ,Source="wideOffer1.png" },
                new OfferImage { Name="wideOffer2" ,Source="wideOffer2.png" },
                new OfferImage { Name="wideOffer3" ,Source="wideOffer3.png" },
                new OfferImage { Name="wideOffer4" ,Source="wideOffer4.png" },
            };

            CVwideOffers2.ItemsSource = WideOffers2 = new ObservableCollection<OfferImage> {
                new OfferImage { Name="widelast1" ,Source="widelast1.png" },
                new OfferImage { Name="wideArrivals1" ,Source="wideArrivals1.png" },
            };
        }
        //protected async override void OnAppearing()
        //{
        //    base.OnAppearing();
        //    var allProducts = await firebaseHelper.GetAllProducts();
        //    lstProducts.ItemsSource = allProducts;
        //    Console.WriteLine(allProducts);
        //}
        private void searchBar_TextChanged(object sender, TextChangedEventArgs e)
        {

        }

        private void OnImageNameTapped(object sender, EventArgs e)
        {
            string temp = (sender as Image).Source.ToString();
            var targetpage = new CatalogTilePage();
            Navigation.PushAsync(targetpage);
        }

        private async void RefreshView_Refreshing(object sender, EventArgs e)
        {
            await Task.Delay(1500);
            myRefreshView.IsRefreshing = false;
        }


    }
}